import { db } from "@/lib/db";
import { computeContentPriority, type PriorityTier } from "./content-signals";
import { getViolationHistoriesForBusinesses } from "@/lib/queries/admin";
import { computeBusinessSignals } from "./business-signals";

export interface ModerationQueueItem {
  id: string;
  entityType: "Review" | "BusinessMedia";
  entityId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  authorId?: string;
  authorName?: string;
  priorityScore: number;
  priorityTier: PriorityTier;
  status: string;
  createdAt: Date;
  snippet: string;
  priorViolations: number;
}

interface QueueFilters {
  entityType?: "Review" | "BusinessMedia";
  priorityTier?: PriorityTier | "all";
  limit?: number;
  offset?: number;
}

type BusinessSignalInput = Parameters<typeof computeBusinessSignals>[0];

// Helper: compute risk scores for multiple businesses at once
async function getBusinessRiskScoreMap(
  businessIds: string[]
): Promise<Map<string, number>> {
  if (businessIds.length === 0) return new Map();

  const businesses = await db.business.findMany({
    where: { id: { in: businessIds } },
    include: {
      categories: { include: { category: true } },
      services: { where: { isActive: true } },
      hours: { where: { isOpen: true } },
      media: true,
      ratingStats: true,
    },
  });

  const riskScoreMap = new Map<string, number>();
  for (const business of businesses) {
    const signals = computeBusinessSignals(business as BusinessSignalInput);
    riskScoreMap.set(business.id, signals.riskScore);
  }

  return riskScoreMap;
}

export async function getAdminModerationQueue(filters: QueueFilters = {}) {
  const { entityType, priorityTier = "all", limit = 50, offset = 0 } = filters;

  const [reviews, media] = await Promise.all([
    db.review.findMany({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      include: {
        business: { select: { id: true, name: true, slug: true, ratingStats: true } },
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.businessMedia.findMany({
      where: { status: "ACTIVE" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            ratingStats: true,
            owner: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const allBusinessIds = Array.from(
    new Set([...reviews, ...media].map((i) => i.business.id))
  );
  const [businessViolations, businessRiskScores] = await Promise.all([
    getViolationHistoriesForBusinesses(allBusinessIds),
    getBusinessRiskScoreMap(allBusinessIds),
  ]);

  // Convert to queue items
  const items: ModerationQueueItem[] = [];

  // Add reviews
  for (const review of reviews) {
    const priorViolations = businessViolations.get(review.business.id)?.total ?? 0;
    const riskScore = businessRiskScores.get(review.business.id) ?? 0;
    const priority = computeContentPriority({
      status: review.status,
      createdAt: review.createdAt,
      businessRiskScore: riskScore,
      businessPriorViolations: priorViolations,
    });

    items.push({
      id: review.id,
      entityType: "Review",
      entityId: review.id,
      businessId: review.business.id,
      businessName: review.business.name,
      businessSlug: review.business.slug,
      authorId: review.customerId,
      authorName: [review.customer.firstName, review.customer.lastName]
        .filter(Boolean)
        .join(" "),
      priorityScore: priority.score,
      priorityTier: priority.tier,
      status: review.status,
      createdAt: review.createdAt,
      snippet: review.comment ?? "(No comment)",
      priorViolations,
    });
  }

  // Add media
  for (const m of media) {
    const priorViolations = businessViolations.get(m.business.id)?.total ?? 0;
    const riskScore = businessRiskScores.get(m.business.id) ?? 0;
    const priority = computeContentPriority({
      createdAt: m.createdAt,
      businessRiskScore: riskScore,
      businessPriorViolations: priorViolations,
    });

    items.push({
      id: m.id,
      entityType: "BusinessMedia",
      entityId: m.id,
      businessId: m.business.id,
      businessName: m.business.name,
      businessSlug: m.business.slug,
      authorId: m.business.owner?.id,
      authorName: m.business.owner
        ? [m.business.owner.firstName, m.business.owner.lastName]
            .filter(Boolean)
            .join(" ")
        : undefined,
      priorityScore: priority.score,
      priorityTier: priority.tier,
      status: m.status,
      createdAt: m.createdAt,
      snippet: m.title ?? "(No title)",
      priorViolations,
    });
  }

  // Filter by entity type if specified
  let filtered = items;
  if (entityType) {
    filtered = items.filter((i) => i.entityType === entityType);
  }

  // Filter by priority tier if specified
  if (priorityTier !== "all") {
    filtered = filtered.filter((i) => i.priorityTier === priorityTier);
  }

  // Sort by priority score descending, then by creation date descending
  filtered.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Paginate
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return { items: paginated, total, offset, limit };
}

// Helper function to get stats for the stats bar
export async function getAdminModerationStats() {
  const queue = await getAdminModerationQueue({ limit: 1000 });
  const items = queue.items;

  const pendingCount = items.filter((i) => i.priorityTier === "normal").length;
  const elevatedCount = items.filter((i) => i.priorityTier === "elevated").length;
  const urgentCount = items.filter((i) => i.priorityTier === "urgent").length;

  return {
    total: queue.total,
    pending: pendingCount,
    elevated: elevatedCount,
    urgent: urgentCount,
  };
}
