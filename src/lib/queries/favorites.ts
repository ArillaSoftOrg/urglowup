import { db } from "@/lib/db";
import type { MarketplaceBusiness } from "./marketplace";
import {
  optimizeBusinessCoverUrl,
  optimizeBusinessLogoUrl,
} from "@/lib/optimized-media";

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
          categories: {
            select: {
              category: { select: { name: true, slug: true } },
            },
          },
          media: {
            where: {
              status: "ACTIVE",
              type: { in: ["COVER", "LOGO"] },
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
            select: { bayesianScore: true, rawReviewCount: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(({ business: b }) => {
    const coverMedia = b.media.find((item) => item.type === "COVER");
    const logoMedia = b.media.find((item) => item.type === "LOGO");

    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      coverImageUrl: optimizeBusinessCoverUrl(coverMedia, b.coverImageUrl),
      logoUrl: optimizeBusinessLogoUrl(logoMedia, b.logoUrl),
      city: b.city,
      district: b.district,
      categories: b.categories,
      reviewCount: b.ratingStats?.rawReviewCount ?? 0,
      reviewAvg: b.ratingStats ? Number(b.ratingStats.bayesianScore) : null,
    };
  });
}
