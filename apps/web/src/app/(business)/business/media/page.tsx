import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBusinessMedia, getMediaCounts } from "@/lib/queries/media";
import { MediaGrid } from "@/components/business/media-grid";

export const metadata = { title: "Profilim" };

export default async function MediaPage() {
  const { businessId } = await requireBusiness("MANAGER");

  const [media, counts, services, business] = await Promise.all([
    getBusinessMedia(businessId),
    getMediaCounts(businessId),
    db.businessService.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.business.findUniqueOrThrow({
      where: { id: businessId },
      select: {
        name: true,
        slug: true,
        description: true,
        city: true,
        district: true,
        logoUrl: true,
        coverImageUrl: true,
        categories: {
          select: {
            category: {
              select: { name: true },
            },
          },
          take: 2,
        },
        ratingStats: {
          select: {
            weightedAverage: true,
            rawAverage: true,
            rawReviewCount: true,
          },
        },
        _count: {
          select: {
            services: true,
            reviews: true,
          },
        },
      },
    }),
  ]);

  return (
    <MediaGrid
      business={{
        name: business.name,
        slug: business.slug,
        description: business.description,
        city: business.city,
        district: business.district,
        logoUrl: business.logoUrl,
        coverImageUrl: business.coverImageUrl,
        categories: business.categories.map((item) => item.category.name),
        serviceCount: business._count.services,
        reviewCount: business.ratingStats?.rawReviewCount ?? business._count.reviews,
        rating:
          business.ratingStats?.weightedAverage ??
          business.ratingStats?.rawAverage ??
          null,
      }}
      media={media}
      imageCount={counts.imageCount}
      videoCount={counts.videoCount}
      services={services}
    />
  );
}
