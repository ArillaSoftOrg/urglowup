import { db } from "@/lib/db";
import type { MarketplaceBusiness } from "./marketplace";
import {
  optimizeBusinessCoverUrl,
  optimizeBusinessLogoUrl,
} from "@/lib/optimized-media";
import {
  isNewToUrGlowUp,
  parseMarketplaceLaunchAt,
} from "@/lib/marketplace/ranking";

export async function getCustomerFavorites(userId: string): Promise<MarketplaceBusiness[]> {
  const rows = await db.favorite.findMany({
    where: { userId },
    select: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          coverImageUrl: true,
          logoUrl: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          status: true,
          isMarketplaceVisible: true,
          ownershipStatus: true,
          marketplaceJoinedAt: true,
          isEditoriallyRecommended: true,
          editorialRecommendationRank: true,
          instantConfirmation: true,
          inAppPayment: true,
          categories: {
            select: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          media: {
            where: {
              status: "ACTIVE",
              type: {
                in: [
                  "COVER",
                  "LOGO",
                  "PORTFOLIO_IMAGE",
                  "PORTFOLIO_VIDEO",
                  "BEFORE_AFTER",
                ],
              },
            },
            select: {
              type: true,
              publicId: true,
              cropX: true,
              cropY: true,
              cropWidth: true,
              cropHeight: true,
            },
          },
          ratingStats: {
            select: {
              bayesianScore: true,
              rawReviewCount: true,
              recentReviewCount: true,
            },
          },
          services: {
            where: { isActive: true },
            select: { name: true },
          },
          hours: {
            where: { isOpen: true },
            select: { dayOfWeek: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(({ business: b }) => {
    const coverMedia = b.media.find((item) => item.type === "COVER");
    const logoMedia = b.media.find((item) => item.type === "LOGO");
    const launchAt = parseMarketplaceLaunchAt(
      process.env.MARKETPLACE_PUBLIC_LAUNCH_AT,
    );

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      coverImageUrl: optimizeBusinessCoverUrl(coverMedia, b.coverImageUrl),
      logoUrl: optimizeBusinessLogoUrl(logoMedia, b.logoUrl),
      city: b.city,
      district: b.district,
      latitude: b.latitude,
      longitude: b.longitude,
      categories: b.categories,
      reviewCount: b.ratingStats?.rawReviewCount ?? 0,
      reviewAvg:
        b.ratingStats?.bayesianScore != null
          ? Number(b.ratingStats.bayesianScore)
          : null,
      recentReviewCount: b.ratingStats?.recentReviewCount ?? 0,
      ownershipStatus: b.ownershipStatus,
      marketplaceJoinedAt: b.marketplaceJoinedAt,
      isEditoriallyRecommended: b.isEditoriallyRecommended,
      editorialRecommendationRank: b.editorialRecommendationRank,
      instantConfirmation: b.instantConfirmation,
      inAppPayment: b.inAppPayment,
      activeServiceNames: b.services.map((service) => service.name),
      activeServiceCount: b.services.length,
      openHourCount: b.hours.length,
      activePortfolioCount: b.media.filter((item) =>
        ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"].includes(
          item.type,
        ),
      ).length,
      isNewToUrGlowUp: isNewToUrGlowUp(
        {
          ownershipStatus: b.ownershipStatus,
          marketplaceJoinedAt: b.marketplaceJoinedAt,
          status: b.status,
          isMarketplaceVisible: b.isMarketplaceVisible,
        },
        launchAt,
      ),
    };
  });
}
