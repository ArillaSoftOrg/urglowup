"use server";

import { requireRole } from "@/lib/auth";
import { UserRole, BusinessMemberRole, MembershipStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { ADMIN_PLACE_REFERENCE_TRANSITIONS } from "@/lib/constants/place-reference";
import {
  GOOGLE_PLACES_DETAILS_API,
  PLACES_DISCOVERY_MAX_RESULTS,
  PLACES_LOCATION_TIMEOUT_MS,
} from "@/lib/constants/external";
import { discoverGooglePlaceIds } from "@/lib/external/google/places-discovery";
import {
  calculateBackoffMs,
  canRetry,
  delay,
  isRetryableStatusCode,
} from "@/lib/external/google/rate-limit";
import type { PlaceReferenceStatus } from "@/generated/prisma/enums";

export type PlaceReferenceActionState = {
  success: boolean;
  message?: string;
};

type GooglePlacePrefillData = {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  whatsapp?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  latitude?: number;
  longitude?: number;
  photoPreviewUrl?: string;
  attributionLabel?: string;
};

type GooglePlacePrefillResult = {
  success: boolean;
  message?: string;
  data?: GooglePlacePrefillData;
};

type GooglePlaceDetailsResponse = {
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    types?: string[];
  }>;
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{ displayName?: string }>;
  }>;
};

type GooglePlacePhotoMediaResponse = {
  photoUri?: string;
};

async function logAdminAction(
  adminId: string,
  action: string,
  targetId: string,
  details?: string
) {
  try {
    await db.adminAction.create({
      data: {
        adminId,
        action,
        targetType: "PlaceReference",
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

function revalidatePlaceReferences() {
  revalidatePath("/admin/place-references");
}

function resolvePlacesApiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    null
  );
}

function getAddressComponent(
  components: GooglePlaceDetailsResponse["addressComponents"],
  types: string[],
) {
  return components?.find((component) =>
    types.some((type) => component.types?.includes(type)),
  )?.longText;
}

function inferCityAndDistrict(
  details: GooglePlaceDetailsResponse,
  fallback: { city: string | null; district: string | null },
) {
  const city =
    fallback.city ||
    getAddressComponent(details.addressComponents, [
      "administrative_area_level_1",
      "locality",
    ]) ||
    null;
  const district =
    fallback.district ||
    getAddressComponent(details.addressComponents, [
      "administrative_area_level_2",
      "sublocality",
      "sublocality_level_1",
      "locality",
    ]) ||
    null;

  return { city, district };
}

function buildDescriptionDraft({
  name,
  categoryHint,
  city,
  district,
}: {
  name?: string;
  categoryHint: string | null;
  city: string | null;
  district: string | null;
}) {
  const service = categoryHint?.trim() || "hizmet";
  const location = [district, city].filter(Boolean).join(" / ");
  if (name && location) {
    return `${name}, ${location} bölgesinde ${service} hizmetleri sunan bir işletmedir.`;
  }
  if (name) {
    return `${name}, ${service} hizmetleri sunan bir işletmedir.`;
  }
  if (location) {
    return `${location} bölgesinde ${service} hizmetleri sunan bir işletme.`;
  }
  return `${service} hizmetleri sunan bir işletme.`;
}

async function fetchGooglePlacePhotoPreview(
  photoName: string | undefined,
  apiKey: string,
): Promise<string | undefined> {
  if (!photoName) return undefined;
  const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=420&skipHttpRedirect=true&key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(mediaUrl, { method: "GET" });
    if (!res.ok) return undefined;
    const json = (await res.json()) as GooglePlacePhotoMediaResponse;
    return typeof json.photoUri === "string" ? json.photoUri : undefined;
  } catch {
    return undefined;
  }
}

async function fetchGooglePlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<GooglePlaceDetailsResponse | null> {
  const url = `${GOOGLE_PLACES_DETAILS_API}/${encodeURIComponent(placeId)}`;
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "websiteUri",
    "googleMapsUri",
    "location",
    "addressComponents",
    "photos",
  ].join(",");

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PLACES_LOCATION_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort && canRetry(attempt)) {
        await delay(calculateBackoffMs(attempt));
        continue;
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 404) return null;
    if (!res.ok) {
      if (isRetryableStatusCode(res.status) && canRetry(attempt)) {
        await delay(calculateBackoffMs(attempt));
        continue;
      }
      return null;
    }

    try {
      return (await res.json()) as GooglePlaceDetailsResponse;
    } catch {
      return null;
    }
  }
}

// ─── Status Update ──────────────────────────────────────────────

const updateStatusSchema = z.object({
  placeReferenceId: z.string().min(1),
  newStatus: z.enum([
    "DISCOVERED",
    "APPROVED",
    "HIDDEN",
    "DUPLICATE",
    "CLAIM_PENDING",
    "CLAIMED",
    "REJECTED",
    "STALE",
    "ERROR",
  ]),
});

export async function updatePlaceReferenceStatus(
  placeReferenceId: string,
  newStatus: PlaceReferenceStatus
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = updateStatusSchema.safeParse({ placeReferenceId, newStatus });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const record = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: { status: true },
  });

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }

  const allowed = ADMIN_PLACE_REFERENCE_TRANSITIONS[record.status as PlaceReferenceStatus];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Cannot transition from ${record.status} to ${newStatus}.`,
    };
  }

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { status: newStatus },
  });

  await logAdminAction(
    admin.id,
    "placeReference.update_status",
    placeReferenceId,
    `${record.status} → ${newStatus}`
  );

  revalidatePlaceReferences();
  return { success: true, message: `Status updated to ${newStatus}.` };
}

// ─── Metadata Update ────────────────────────────────────────────

const updateMetadataSchema = z.object({
  placeReferenceId: z.string().min(1),
  city: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  categoryHint: z.string().max(100).optional(),
});

export async function updatePlaceReferenceMetadata(
  placeReferenceId: string,
  fields: { city?: string; district?: string; categoryHint?: string }
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = updateMetadataSchema.safeParse({ placeReferenceId, ...fields });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const record = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: { id: true },
  });

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }

  // Empty string → null normalization
  const city = fields.city?.trim() || null;
  const district = fields.district?.trim() || null;
  const categoryHint = fields.categoryHint?.trim() || null;

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { city, district, categoryHint },
  });

  await logAdminAction(
    admin.id,
    "placeReference.update_metadata",
    placeReferenceId,
    `city=${city}, district=${district}, categoryHint=${categoryHint}`
  );

  revalidatePlaceReferences();
  return { success: true, message: "Metadata updated." };
}

// ─── Link / Unlink Business ─────────────────────────────────────

const linkBusinessSchema = z.object({
  placeReferenceId: z.string().min(1),
  businessId: z.string().min(1),
});

export async function linkPlaceReferenceToBusiness(
  placeReferenceId: string,
  businessId: string
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = linkBusinessSchema.safeParse({ placeReferenceId, businessId });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const [record, business] = await Promise.all([
    db.placeReference.findUnique({
      where: { id: placeReferenceId },
      select: { id: true, claimedBusinessId: true },
    }),
    db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    }),
  ]);

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }
  if (!business) {
    return { success: false, message: "Business not found." };
  }
  if (record.claimedBusinessId) {
    return {
      success: false,
      message: "Already linked to a business. Unlink first.",
    };
  }

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { claimedBusinessId: businessId },
  });

  await logAdminAction(
    admin.id,
    "placeReference.link_business",
    placeReferenceId,
    `linked to Business ${businessId} (${business.name})`
  );

  revalidatePlaceReferences();
  return { success: true, message: `Linked to "${business.name}".` };
}

const unlinkSchema = z.object({
  placeReferenceId: z.string().min(1),
});

export async function unlinkPlaceReferenceFromBusiness(
  placeReferenceId: string
): Promise<PlaceReferenceActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = unlinkSchema.safeParse({ placeReferenceId });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const record = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: { id: true, claimedBusinessId: true },
  });

  if (!record) {
    return { success: false, message: "Place reference not found." };
  }
  if (!record.claimedBusinessId) {
    return { success: false, message: "Not linked to any business." };
  }

  await db.placeReference.update({
    where: { id: placeReferenceId },
    data: { claimedBusinessId: null },
  });

  await logAdminAction(
    admin.id,
    "placeReference.unlink_business",
    placeReferenceId,
    `unlinked from Business ${record.claimedBusinessId}`
  );

  revalidatePlaceReferences();
  return { success: true, message: "Business link removed." };
}

// ─── Convert PlaceReference → Business ──────────────────────────

class ConvertError extends Error {}

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  );
}

function normalizeSocialUrl(value: string | undefined | null, base: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  return `${base}${trimmed.replace(/^@/, "")}`;
}

export async function adminFetchGooglePlacePrefill(
  placeReferenceId: string,
): Promise<GooglePlacePrefillResult> {
  await requireRole(UserRole.ADMIN);

  const parsed = z.string().min(1).safeParse(placeReferenceId);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const ref = await db.placeReference.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      provider: true,
      providerPlaceId: true,
      city: true,
      district: true,
      categoryHint: true,
      claimedBusinessId: true,
    },
  });

  if (!ref) {
    return { success: false, message: "Referans bulunamadı." };
  }
  if (ref.provider !== "GOOGLE" || !ref.providerPlaceId) {
    return { success: false, message: "Yalnızca Google referansları otomatik doldurulabilir." };
  }
  if (ref.claimedBusinessId !== null) {
    return { success: false, message: "Bu referans zaten bir işletmeye bağlı." };
  }

  const apiKey = resolvePlacesApiKey();
  if (!apiKey) {
    return {
      success: false,
      message: "Google verileri alınamadı, manuel doldurabilirsiniz.",
    };
  }

  const details = await fetchGooglePlaceDetails(ref.providerPlaceId, apiKey);
  if (!details) {
    return {
      success: false,
      message: "Google verileri alınamadı, manuel doldurabilirsiniz.",
    };
  }

  const name = details.displayName?.text?.trim() || undefined;
  const { city, district } = inferCityAndDistrict(details, {
    city: ref.city,
    district: ref.district,
  });
  const phone =
    details.nationalPhoneNumber?.trim() ||
    details.internationalPhoneNumber?.trim() ||
    undefined;
  const firstPhoto = details.photos?.[0];
  const photoPreviewUrl = await fetchGooglePlacePhotoPreview(firstPhoto?.name, apiKey);
  const attributionLabel =
    firstPhoto?.authorAttributions
      ?.map((attribution) => attribution.displayName)
      .filter((value): value is string => Boolean(value?.trim()))
      .join(", ") || "Google";

  return {
    success: true,
    data: {
      name,
      description: buildDescriptionDraft({
        name,
        categoryHint: ref.categoryHint,
        city,
        district,
      }),
      address: details.formattedAddress?.trim() || undefined,
      city: city || undefined,
      district: district || undefined,
      phone,
      whatsapp: phone,
      websiteUri: details.websiteUri?.trim() || undefined,
      googleMapsUri: details.googleMapsUri?.trim() || undefined,
      latitude:
        typeof details.location?.latitude === "number"
          ? details.location.latitude
          : undefined,
      longitude:
        typeof details.location?.longitude === "number"
          ? details.location.longitude
          : undefined,
      photoPreviewUrl,
      attributionLabel,
    },
  };
}

const convertPlaceReferenceSchema = z.object({
  placeReferenceId: z.string().min(1),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  instagramUrl: z.string().max(200).optional().or(z.literal("")),
  facebookUrl: z.string().max(200).optional().or(z.literal("")),
  tiktokUrl: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  categoryIds: z.array(z.string()).max(10).default([]),
  ownerEmail: z.preprocess(
    (v) => {
      if (typeof v !== "string") return undefined;
      const t = v.trim().toLowerCase();
      return t.length > 0 ? t : undefined;
    },
    z.string().email().optional()
  ),
  instantConfirmation: z.boolean().default(false),
  inAppPayment: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  maxGroupBookingGuests: z.number().int().min(1).max(20).default(4),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export async function adminConvertPlaceReferenceToBusiness(
  input: z.infer<typeof convertPlaceReferenceSchema>
): Promise<PlaceReferenceActionState & { businessId?: string }> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = convertPlaceReferenceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const placeReferenceId = data.placeReferenceId;
  const categoryIds = [...new Set(data.categoryIds)];

  // 4) PlaceReference eligibility (pre-transaction)
  const ref = await db.placeReference.findUnique({
    where: { id: placeReferenceId },
    select: {
      id: true,
      provider: true,
      providerPlaceId: true,
      status: true,
      claimedBusinessId: true,
    },
  });

  if (!ref) {
    return { success: false, message: "Referans bulunamadı." };
  }
  if (ref.provider !== "GOOGLE") {
    return { success: false, message: "Yalnızca Google referansları dönüştürülebilir." };
  }
  if (!ref.providerPlaceId) {
    return { success: false, message: "Geçersiz Place ID." };
  }
  if (ref.claimedBusinessId !== null) {
    return { success: false, message: "Bu referans zaten bir işletmeye bağlı." };
  }
  if (ref.status !== "APPROVED" && ref.status !== "DISCOVERED") {
    return { success: false, message: "Yalnızca DISCOVERED veya APPROVED referanslar işletmeye dönüştürülebilir." };
  }

  // 5) Duplicate googlePlaceId (early UX)
  const existingByPlace = await db.business.findFirst({
    where: { googlePlaceId: ref.providerPlaceId },
    select: { id: true },
  });
  if (existingByPlace) {
    return { success: false, message: "Bu Google Place zaten bir Business ile eşleşmiş." };
  }

  // 6) Category validation
  if (categoryIds.length > 0) {
    const found = await db.businessCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    if (found.length !== categoryIds.length) {
      return { success: false, message: "Geçersiz kategori." };
    }
  }

  // 7) Owner resolution + guard (early UX)
  let ownerId: string | null = null;
  const ownerEmail = data.ownerEmail ?? null;
  if (ownerEmail) {
    const owner = await db.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });
    if (!owner) {
      return { success: false, message: `'${ownerEmail}' e-postasına sahip kullanıcı bulunamadı.` };
    }
    const [memberBusiness, legacyBusiness] = await Promise.all([
      db.businessMember.findFirst({
        where: { userId: owner.id, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
        select: { businessId: true },
      }),
      db.business.findFirst({ where: { ownerId: owner.id }, select: { id: true } }),
    ]);
    if (memberBusiness || legacyBusiness) {
      return { success: false, message: "Bu kullanıcı zaten başka bir işletmenin sahibidir." };
    }
    ownerId = owner.id;
  }

  // 8) Slug
  const slug = await generateUniqueSlug(data.name);

  let business: { id: string };
  try {
    business = await db.$transaction(async (tx) => {
      // 1) Atomic lock: DISCOVERED/APPROVED + unclaimed → CLAIM_PENDING
      const locked = await tx.placeReference.updateMany({
        where: {
          id: placeReferenceId,
          provider: "GOOGLE",
          status: { in: ["DISCOVERED", "APPROVED"] },
          claimedBusinessId: null,
        },
        data: { status: "CLAIM_PENDING" },
      });
      if (locked.count !== 1) {
        throw new ConvertError("Referans artık dönüştürülebilir durumda değil.");
      }

      const fresh = await tx.placeReference.findUniqueOrThrow({
        where: { id: placeReferenceId },
        select: { providerPlaceId: true },
      });

      // 2) In-tx duplicate googlePlaceId guard
      const dup = await tx.business.findFirst({
        where: { googlePlaceId: fresh.providerPlaceId },
        select: { id: true },
      });
      if (dup) {
        throw new ConvertError("Bu Google Place zaten bir Business ile eşleşmiş.");
      }

      // 3) In-tx owner guard
      if (ownerId) {
        const [m, l] = await Promise.all([
          tx.businessMember.findFirst({
            where: { userId: ownerId, role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
            select: { businessId: true },
          }),
          tx.business.findFirst({ where: { ownerId }, select: { id: true } }),
        ]);
        if (m || l) {
          throw new ConvertError("Bu kullanıcı zaten başka bir işletmenin sahibidir.");
        }
      }

      const created = await tx.business.create({
        data: {
          name: data.name,
          slug,
          description: data.description?.trim() || null,
          phone: data.phone?.trim() || null,
          whatsapp: data.whatsapp?.trim() || null,
          instagramUrl: normalizeSocialUrl(data.instagramUrl, "https://instagram.com/"),
          facebookUrl: normalizeSocialUrl(data.facebookUrl, "https://facebook.com/"),
          tiktokUrl: normalizeSocialUrl(data.tiktokUrl, "https://tiktok.com/@"),
          city: data.city?.trim() || null,
          district: data.district?.trim() || null,
          address: data.address?.trim() || null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          geocodedAt: data.latitude !== undefined && data.longitude !== undefined ? new Date() : null,
          geocodingStatus: data.latitude !== undefined && data.longitude !== undefined ? "GOOGLE_PLACE" : null,
          googlePlaceId: fresh.providerPlaceId,
          status: "ACTIVE_PRIVATE",
          isMarketplaceVisible: false,
          instantConfirmation: ownerId ? data.instantConfirmation : false,
          inAppPayment: ownerId ? data.inAppPayment : false,
          petFriendly: ownerId ? data.petFriendly : false,
          maxGroupBookingGuests: data.maxGroupBookingGuests,
          ...(ownerId
            ? { ownerId, ownershipStatus: "CLAIMED" as const }
            : { ownerId: null, ownershipStatus: "UNCLAIMED" as const }),
        },
        select: { id: true },
      });

      if (categoryIds.length > 0) {
        await tx.businessToCategory.createMany({
          data: categoryIds.map((categoryId) => ({ businessId: created.id, categoryId })),
          skipDuplicates: true,
        });
      }

      if (ownerId) {
        await tx.businessMember.upsert({
          where: { businessId_userId: { businessId: created.id, userId: ownerId } },
          create: {
            businessId: created.id,
            userId: ownerId,
            role: BusinessMemberRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
          update: { role: BusinessMemberRole.OWNER, status: MembershipStatus.ACTIVE },
        });
        await tx.user.update({
          where: { id: ownerId },
          data: { role: UserRole.BUSINESS_OWNER },
        });
      }

      // 4) Final: CLAIM_PENDING → CLAIMED + link
      await tx.placeReference.update({
        where: { id: placeReferenceId },
        data: { claimedBusinessId: created.id, status: "CLAIMED" },
      });

      return created;
    });
  } catch (err) {
    if (err instanceof ConvertError) {
      return { success: false, message: err.message };
    }
    if (isPrismaUniqueError(err)) {
      return { success: false, message: "Bu Google Place zaten bir Business ile eşleşmiş." };
    }
    throw err;
  }

  await logAdminAction(
    admin.id,
    "placeReference.convert_to_business",
    placeReferenceId,
    `→ Business ${business.id}${ownerId ? ` owner:${ownerEmail}` : " (sahipsiz)"}`
  );

  revalidatePath("/admin/place-references");
  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${business.id}`);
  return { success: true, businessId: business.id, message: "İşletme oluşturuldu." };
}

// ─── Google Places Discovery ────────────────────────────────────

export type PlaceDiscoveryActionState = {
  success: boolean;
  message?: string;
  created?: number;
  skipped?: number;
  total?: number;
  dryRun?: boolean;
};

const discoverSchema = z.object({
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().max(100).optional().or(z.literal("")),
  categoryHint: z.string().trim().min(1).max(100),
  queryText: z.string().trim().max(200).optional().or(z.literal("")),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(PLACES_DISCOVERY_MAX_RESULTS)
    .default(PLACES_DISCOVERY_MAX_RESULTS),
});

/** Strip control chars / newlines to keep the text query single-line and safe. */
function sanitizeSegment(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function adminDiscoverPlaceReferences(
  input: z.infer<typeof discoverSchema>
): Promise<PlaceDiscoveryActionState> {
  const admin = await requireRole(UserRole.ADMIN);

  const parsed = discoverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const city = sanitizeSegment(parsed.data.city);
  const district = sanitizeSegment(parsed.data.district ?? "");
  const categoryHint = sanitizeSegment(parsed.data.categoryHint);
  const queryText = sanitizeSegment(parsed.data.queryText ?? "");
  const maxResults = parsed.data.maxResults;

  const textQuery = [queryText, categoryHint, district, city]
    .filter(Boolean)
    .join(" ");

  const result = await discoverGooglePlaceIds(textQuery, maxResults);

  if (!result.ok) {
    const message =
      result.error === "NO_API_KEY"
        ? "Google Places API anahtarı yapılandırılmamış."
        : result.error === "RATE_LIMITED"
          ? "Google Places istek sınırına ulaşıldı. Lütfen sonra tekrar deneyin."
          : result.error === "TIMEOUT"
            ? "Google Places yanıt vermedi (zaman aşımı)."
            : "Google Places araması başarısız oldu.";
    return { success: false, message };
  }

  const dryRun = result.dryRun === true;
  const uniquePlaceIds = [...new Set(result.placeIds)];
  const total = uniquePlaceIds.length;

  if (total === 0) {
    return {
      success: true,
      message: dryRun ? "[DRY-RUN] Sonuç bulunamadı." : "Sonuç bulunamadı.",
      created: 0,
      skipped: 0,
      total: 0,
      dryRun,
    };
  }

  // Native content YOK — yalnızca id + operasyonel segment etiketi yazılır.
  // Gerçek eklenen sayı createMany sonucundan alınır (skipDuplicates unique
  // @@unique([provider, providerPlaceId]) ihlallerini atlar).
  const createResult = await db.placeReference.createMany({
    data: uniquePlaceIds.map((providerPlaceId) => ({
      provider: "GOOGLE",
      providerPlaceId,
      status: "DISCOVERED" as PlaceReferenceStatus,
      city: city || null,
      district: district || null,
      categoryHint: categoryHint || null,
      fetchStatus: "DISCOVERED",
      lastFetchedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  const created = createResult.count;
  const skipped = total - created;

  await logAdminAction(
    admin.id,
    "placeReference.discover",
    "-",
    `${dryRun ? "[dry-run] " : ""}city=${city} district=${district || "-"} cat=${categoryHint} created=${created} skipped=${skipped} total=${total}`
  );

  revalidatePlaceReferences();
  return {
    success: true,
    created,
    skipped,
    total,
    dryRun,
    message: `${dryRun ? "[DRY-RUN] " : ""}${created} eklendi · ${skipped} zaten vardı · toplam ${total}`,
  };
}
