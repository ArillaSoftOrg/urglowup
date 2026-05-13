import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBusinessMedia, getMediaCounts } from "@/lib/queries/media";
import { MediaGrid } from "@/components/business/media-grid";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  const { businessId } = await requireBusiness();

  const [media, counts, services] = await Promise.all([
    getBusinessMedia(businessId),
    getMediaCounts(businessId),
    db.businessService.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="text-muted-foreground">
          Manage your cover image, logo, and portfolio.
        </p>
      </div>

      <MediaGrid
        media={media}
        imageCount={counts.imageCount}
        videoCount={counts.videoCount}
        services={services}
      />
    </div>
  );
}
