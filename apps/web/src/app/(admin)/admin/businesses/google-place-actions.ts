"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  fetchGooglePlaceCandidate,
  searchGooglePlaceCandidates,
  type GooglePlaceCandidate,
} from "@/lib/external/google/place-matching";

const businessIdSchema = z.string().min(1);
const matchSchema = z.object({
  businessId: z.string().min(1),
  placeId: z.string().min(1).max(255),
});

export type AdminGooglePlaceCandidate = GooglePlaceCandidate & {
  linkedBusinessName: string | null;
};

export type GooglePlaceSearchActionResult = {
  success: boolean;
  message?: string;
  candidates: AdminGooglePlaceCandidate[];
};

export type GooglePlaceMatchActionResult = {
  success: boolean;
  message: string;
};

function errorMessage(error?: string) {
  if (error === "NO_API_KEY") {
    return "Google Places sunucu anahtarı yapılandırılmamış.";
  }
  if (error === "TIMEOUT") {
    return "Google Places zaman aşımına uğradı. Tekrar deneyin.";
  }
  return "Google Places sonuçları alınamadı.";
}

async function revalidateBusiness(businessId: string, slug: string) {
  await invalidateCache(`business:v2:slug:${slug}`);
  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath(`/b/${slug}`);
  revalidatePath("/admin/place-references");
}

export async function findGooglePlaceCandidates(
  businessId: string,
): Promise<GooglePlaceSearchActionResult> {
  await requireRole(UserRole.ADMIN);

  const parsed = businessIdSchema.safeParse(businessId);
  if (!parsed.success) {
    return { success: false, message: "Geçersiz işletme.", candidates: [] };
  }

  const business = await db.business.findUnique({
    where: { id: parsed.data },
    select: {
      name: true,
      address: true,
      district: true,
      city: true,
    },
  });
  if (!business) {
    return { success: false, message: "İşletme bulunamadı.", candidates: [] };
  }

  const textQuery = [
    business.name,
    business.address,
    business.district,
    business.city,
  ]
    .filter(Boolean)
    .join(", ");
  const result = await searchGooglePlaceCandidates(textQuery);
  if (!result.ok) {
    return {
      success: false,
      message: errorMessage(result.error),
      candidates: [],
    };
  }

  const linkedBusinesses =
    result.candidates.length > 0
      ? await db.business.findMany({
          where: {
            googlePlaceId: {
              in: result.candidates.map((candidate) => candidate.placeId),
            },
          },
          select: { googlePlaceId: true, name: true },
        })
      : [];
  const linkedByPlaceId = new Map(
    linkedBusinesses.map((item) => [item.googlePlaceId, item.name]),
  );

  return {
    success: true,
    message:
      result.candidates.length === 0
        ? "Google'da eşleşen işletme bulunamadı."
        : `${result.candidates.length} aday bulundu.`,
    candidates: result.candidates.map((candidate) => ({
      ...candidate,
      linkedBusinessName:
        linkedByPlaceId.get(candidate.placeId) ?? null,
    })),
  };
}

export async function matchGooglePlaceToBusiness(
  input: z.infer<typeof matchSchema>,
): Promise<GooglePlaceMatchActionResult> {
  const admin = await requireRole(UserRole.ADMIN);
  const parsed = matchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Geçersiz eşleştirme isteği." };
  }

  const { businessId, placeId } = parsed.data;
  const [business, duplicate, existingReference, candidate] = await Promise.all([
    db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true, googlePlaceId: true },
    }),
    db.business.findFirst({
      where: { googlePlaceId: placeId, id: { not: businessId } },
      select: { name: true },
    }),
    db.placeReference.findUnique({
      where: {
        provider_providerPlaceId: {
          provider: "GOOGLE",
          providerPlaceId: placeId,
        },
      },
      select: { id: true, claimedBusinessId: true },
    }),
    fetchGooglePlaceCandidate(placeId),
  ]);

  if (!business) {
    return { success: false, message: "İşletme bulunamadı." };
  }
  if (!candidate) {
    return {
      success: false,
      message: "Google işletmesi doğrulanamadı. Tekrar arama yapın.",
    };
  }
  if (duplicate) {
    return {
      success: false,
      message: `Bu Google işletmesi "${duplicate.name}" ile eşleşmiş.`,
    };
  }
  if (
    existingReference?.claimedBusinessId &&
    existingReference.claimedBusinessId !== businessId
  ) {
    return {
      success: false,
      message: "Bu Google referansı başka bir işletmeye bağlı.",
    };
  }

  await db.$transaction(async (tx) => {
    if (business.googlePlaceId && business.googlePlaceId !== placeId) {
      await tx.placeReference.updateMany({
        where: {
          provider: "GOOGLE",
          providerPlaceId: business.googlePlaceId,
          claimedBusinessId: businessId,
        },
        data: { claimedBusinessId: null },
      });
    }

    await tx.business.update({
      where: { id: businessId },
      data: {
        googlePlaceId: placeId,
        googlePlaceMatchStatus: "MATCHED",
        googlePlaceMatchAttemptedAt: new Date(),
        googlePlaceMatchError: null,
      },
    });

    await tx.placeReference.upsert({
      where: {
        provider_providerPlaceId: {
          provider: "GOOGLE",
          providerPlaceId: placeId,
        },
      },
      create: {
        provider: "GOOGLE",
        providerPlaceId: placeId,
        claimedBusinessId: businessId,
        status: "APPROVED",
        lastFetchedAt: new Date(),
        fetchStatus: "MATCHED_BY_ADMIN",
      },
      update: {
        claimedBusinessId: businessId,
        status: existingReference ? undefined : "APPROVED",
        lastFetchedAt: new Date(),
        fetchStatus: "MATCHED_BY_ADMIN",
      },
    });

    await tx.adminAction.create({
      data: {
        adminId: admin.id,
        action: "business.match_google_place",
        targetType: "Business",
        targetId: businessId,
        details: `${candidate.name} (${placeId})`,
      },
    });
  });

  await revalidateBusiness(businessId, business.slug);
  return {
    success: true,
    message: `"${candidate.name}" Google işletmesiyle eşleştirildi.`,
  };
}

export async function removeGooglePlaceMatch(
  businessId: string,
): Promise<GooglePlaceMatchActionResult> {
  const admin = await requireRole(UserRole.ADMIN);
  const parsed = businessIdSchema.safeParse(businessId);
  if (!parsed.success) {
    return { success: false, message: "Geçersiz işletme." };
  }

  const business = await db.business.findUnique({
    where: { id: parsed.data },
    select: { id: true, slug: true, googlePlaceId: true },
  });
  if (!business) {
    return { success: false, message: "İşletme bulunamadı." };
  }
  if (!business.googlePlaceId) {
    return { success: false, message: "Google eşleşmesi bulunmuyor." };
  }

  await db.$transaction([
    db.business.update({
      where: { id: business.id },
      data: {
        googlePlaceId: null,
        googlePlaceMatchStatus: null,
        googlePlaceMatchAttemptedAt: null,
        googlePlaceMatchError: null,
      },
    }),
    db.placeReference.updateMany({
      where: {
        provider: "GOOGLE",
        providerPlaceId: business.googlePlaceId,
        claimedBusinessId: business.id,
      },
      data: { claimedBusinessId: null },
    }),
    db.adminAction.create({
      data: {
        adminId: admin.id,
        action: "business.remove_google_place",
        targetType: "Business",
        targetId: business.id,
        details: business.googlePlaceId,
      },
    }),
  ]);

  await revalidateBusiness(business.id, business.slug);
  return { success: true, message: "Google işletme eşleşmesi kaldırıldı." };
}
