import { Sparkles } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl, getVideoPosterUrl } from "@/lib/cloudinary";
import { BusinessGalleryLightboxHero } from "./business-gallery-lightbox-hero";

export interface GalleryItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  posterUrl?: string;
  title: string | null;
  width: number | null;
  height: number | null;
  isVideo: boolean;
}

function mediaToGalleryItem(m: BusinessWithDetails["media"][number]): GalleryItem {
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
  const posterUrl =
    isVideo && m.publicId
      ? getVideoPosterUrl(m.publicId, { width: 700, crop: "limit" })
      : undefined;

  return {
    id: m.id,
    url: fullUrl,
    thumbnailUrl,
    posterUrl,
    title: m.title,
    width: m.originalWidth,
    height: m.originalHeight,
    isVideo,
  };
}

/** Hero/üst bölüm için sadece COVER görselleri döndürür. */
export function buildGalleryItems(business: BusinessWithDetails): GalleryItem[] {
  const coverItems = business.media
    .filter((m) => m.type === "COVER")
    .map(mediaToGalleryItem);

  if (coverItems.length > 0) return coverItems;

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

/** Portföy bölümü için sadece PORTFOLIO_IMAGE ve PORTFOLIO_VIDEO görselleri döndürür. */
export function buildPortfolioItems(business: BusinessWithDetails): GalleryItem[] {
  return business.media
    .filter((m) => m.type === "PORTFOLIO_IMAGE" || m.type === "PORTFOLIO_VIDEO")
    .map(mediaToGalleryItem);
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

  return <BusinessGalleryLightboxHero items={items} business={business} />;
}
