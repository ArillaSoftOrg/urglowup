import {
  GOOGLE_PLACE_BACKFILL_BATCH_SIZE,
  GOOGLE_PLACE_MATCH_RETRY_DAYS,
} from "./constants";
import { invalidateCache } from "../../cache";
import { db } from "@urglowup/db";
import {
  assessGooglePlaceCandidate,
  searchGooglePlaceCandidates,
  type GooglePlaceMatchBusiness,
} from "./place-matching";

const ACTIVE_BUSINESS_STATUSES = [
  "ACTIVE_PRIVATE",
  "ACTIVE_MARKETPLACE",
] as const;

export type GooglePlaceAutoMatchBusiness = GooglePlaceMatchBusiness & {
  id: string;
  slug: string;
};

export type GooglePlaceAutoMatchOutcome = {
  businessId: string;
  slug: string;
  status: "MATCHED" | "AMBIGUOUS" | "NOT_FOUND" | "ERROR" | "SKIPPED";
  placeId?: string;
  error?: string;
};

function searchQuery(business: GooglePlaceMatchBusiness): string {
  return [
    business.name,
    business.address,
    business.district,
    business.city,
  ]
    .filter(Boolean)
    .join(", ");
}

async function updateAttempt(
  businessId: string,
  status: "AMBIGUOUS" | "NOT_FOUND" | "ERROR",
  error: string | null,
) {
  await db.business.update({
    where: { id: businessId },
    data: {
      googlePlaceMatchStatus: status,
      googlePlaceMatchAttemptedAt: new Date(),
      googlePlaceMatchError: error,
    },
  });
}

async function persistMatch(
  business: GooglePlaceAutoMatchBusiness,
  placeId: string,
  source: "AUTO_MATCHED" | "LINKED_REFERENCE",
): Promise<boolean> {
  const [duplicate, reference] = await Promise.all([
    db.business.findFirst({
      where: {
        googlePlaceId: placeId,
        id: { not: business.id },
      },
      select: { id: true },
    }),
    db.placeReference.findUnique({
      where: {
        provider_providerPlaceId: {
          provider: "GOOGLE",
          providerPlaceId: placeId,
        },
      },
      select: { claimedBusinessId: true },
    }),
  ]);

  if (
    duplicate ||
    (reference?.claimedBusinessId &&
      reference.claimedBusinessId !== business.id)
  ) {
    await updateAttempt(
      business.id,
      "AMBIGUOUS",
      "Google Place başka bir işletmeye bağlı.",
    );
    return false;
  }

  const matched = await db.$transaction(async (tx) => {
    const updated = await tx.business.updateMany({
      where: {
        id: business.id,
        googlePlaceId: null,
      },
      data: {
        googlePlaceId: placeId,
        googlePlaceMatchStatus: "MATCHED",
        googlePlaceMatchAttemptedAt: new Date(),
        googlePlaceMatchError: null,
      },
    });
    if (updated.count === 0) return false;

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
        claimedBusinessId: business.id,
        status: "APPROVED",
        lastFetchedAt: new Date(),
        fetchStatus: source,
      },
      update: {
        claimedBusinessId: business.id,
        lastFetchedAt: new Date(),
        fetchStatus: source,
      },
    });

    return true;
  });

  if (matched) {
    await invalidateCache(`business:v2:slug:${business.slug}`);
  }
  return matched;
}

export async function resolveGooglePlaceIdForBusiness(
  business: GooglePlaceAutoMatchBusiness,
  options?: { force?: boolean },
): Promise<GooglePlaceAutoMatchOutcome> {
  const current = await db.business.findUnique({
    where: { id: business.id },
    select: {
      googlePlaceId: true,
      googlePlaceMatchAttemptedAt: true,
      placeReferences: {
        where: {
          provider: "GOOGLE",
          claimedBusinessId: business.id,
        },
        select: { providerPlaceId: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!current) {
    return {
      businessId: business.id,
      slug: business.slug,
      status: "ERROR",
      error: "İşletme bulunamadı.",
    };
  }
  if (current.googlePlaceId) {
    return {
      businessId: business.id,
      slug: business.slug,
      status: "MATCHED",
      placeId: current.googlePlaceId,
    };
  }

  const linkedReference = current.placeReferences[0]?.providerPlaceId;
  if (linkedReference) {
    const matched = await persistMatch(
      business,
      linkedReference,
      "LINKED_REFERENCE",
    );
    return {
      businessId: business.id,
      slug: business.slug,
      status: matched ? "MATCHED" : "AMBIGUOUS",
      ...(matched ? { placeId: linkedReference } : {}),
    };
  }

  const retryAfter = new Date(
    Date.now() - GOOGLE_PLACE_MATCH_RETRY_DAYS * 24 * 60 * 60 * 1000,
  );
  if (
    !options?.force &&
    current.googlePlaceMatchAttemptedAt &&
    current.googlePlaceMatchAttemptedAt > retryAfter
  ) {
    return {
      businessId: business.id,
      slug: business.slug,
      status: "SKIPPED",
    };
  }

  const result = await searchGooglePlaceCandidates(searchQuery(business));
  if (!result.ok) {
    const error = result.error ?? "UPSTREAM_ERROR";
    await updateAttempt(business.id, "ERROR", error);
    return {
      businessId: business.id,
      slug: business.slug,
      status: "ERROR",
      error,
    };
  }

  const strongMatches = result.candidates
    .map((candidate) => assessGooglePlaceCandidate(business, candidate))
    .filter((assessment) => assessment.isStrongMatch);

  if (strongMatches.length !== 1) {
    const status =
      result.candidates.length === 0 ? "NOT_FOUND" : "AMBIGUOUS";
    await updateAttempt(
      business.id,
      status,
      strongMatches.length > 1
        ? "Birden fazla güçlü Google Place eşleşmesi bulundu."
        : null,
    );
    return {
      businessId: business.id,
      slug: business.slug,
      status,
    };
  }

  const placeId = strongMatches[0].candidate.placeId;
  const matched = await persistMatch(business, placeId, "AUTO_MATCHED");
  return {
    businessId: business.id,
    slug: business.slug,
    status: matched ? "MATCHED" : "AMBIGUOUS",
    ...(matched ? { placeId } : {}),
  };
}

export async function backfillMissingGooglePlaceIds(
  limit = GOOGLE_PLACE_BACKFILL_BATCH_SIZE,
) {
  const retryBefore = new Date(
    Date.now() - GOOGLE_PLACE_MATCH_RETRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const businesses = await db.business.findMany({
    where: {
      googlePlaceId: null,
      status: { in: [...ACTIVE_BUSINESS_STATUSES] },
      OR: [
        { googlePlaceMatchAttemptedAt: null },
        { googlePlaceMatchAttemptedAt: { lt: retryBefore } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      address: true,
      city: true,
      district: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 50)),
  });

  const outcomes: GooglePlaceAutoMatchOutcome[] = [];
  for (const business of businesses) {
    outcomes.push(await resolveGooglePlaceIdForBusiness(business));
  }

  return {
    processed: outcomes.length,
    matched: outcomes.filter((item) => item.status === "MATCHED").length,
    ambiguous: outcomes.filter((item) => item.status === "AMBIGUOUS").length,
    notFound: outcomes.filter((item) => item.status === "NOT_FOUND").length,
    errors: outcomes.filter((item) => item.status === "ERROR").length,
    outcomes,
  };
}
