import { Sparkles } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { BusinessGalleryLightboxHero } from "./business-gallery-lightbox-hero";

interface GalleryItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string | null;
  width: number | null;
  height: number | null;
  isVideo: boolean;
}

function buildGalleryItems(business: BusinessWithDetails): GalleryItem[] {
  const portfolioItems = business.media
    .filter((m) => m.type !== "LOGO")
    .map((m) => {
      const isVideo = m.type === "PORTFOLIO_VIDEO";
      const cropMeta =
        !isVideo && m.cropX != null
          ? {
              x: m.cropX,
              y: m.cropY!,
              width: m.cropWidth!,
              height: m.cropHeight!,
            }
          : undefined;
      const thumbnailUrl =
        !isVideo && m.publicId
          ? getOptimizedUrl(m.publicId, { width: 700, crop: "limit" }, cropMeta)
          : m.url;
      const fullUrl =
        !isVideo && m.publicId
          ? getOptimizedUrl(m.publicId, { width: 1400, crop: "limit" })
          : m.url;

      return {
        id: m.id,
        url: fullUrl,
        thumbnailUrl,
        title: m.title,
        width: m.originalWidth,
        height: m.originalHeight,
        isVideo,
      };
    });

  if (portfolioItems.length > 0) return portfolioItems;

  if (business.coverImageUrl) {
    return [
      {
        id: "cover",
        url: business.coverImageUrl,
        thumbnailUrl: business.coverImageUrl,
        title: business.name,
        width: null,
        height: null,
        isVideo: false,
      },
    ];
  }

  return [];
}

export function BusinessGalleryHero({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const items = buildGalleryItems(business);

  if (items.length === 0) {
    return (
      <div className="flex aspect-[16/7] min-h-72 items-center justify-center rounded-lg bg-surface-cream">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-background shadow-sm">
            <Sparkles className="size-6 text-brand-pink-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Fotograflar yakinda</p>
        </div>
      </div>
    );
  }

  return <BusinessGalleryLightboxHero items={items} />;
}
