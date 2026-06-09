import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBusinessMedia, getMediaCounts } from "@/lib/queries/media";
import { MediaGrid } from "@/components/business/media-grid";
import { BusinessPageHeader } from "@/components/business/business-page-header";

export const metadata = { title: "Medya" };

export default async function MediaPage() {
  const { businessId } = await requireBusiness("MANAGER");

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
      <BusinessPageHeader
        title="Medya"
        description="Kapak görselinizi, logonuzu ve portföyünüzü yönetin."
      />

      <MediaGrid
        media={media}
        imageCount={counts.imageCount}
        videoCount={counts.videoCount}
        services={services}
      />
    </div>
  );
}
