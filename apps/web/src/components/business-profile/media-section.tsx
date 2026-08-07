import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { GalleryLightbox } from "./gallery-lightbox";

function buildGalleryItems(media: BusinessWithDetails["media"]) {
  return media
    .filter((m) => m.type !== "COVER" && m.type !== "LOGO")
    .map((m) => {
      const isVideo = m.type === "PORTFOLIO_VIDEO";
      const cropMeta =
        !isVideo && m.cropX != null && m.cropY != null && m.cropWidth != null && m.cropHeight != null
          ? { x: m.cropX, y: m.cropY, width: m.cropWidth, height: m.cropHeight }
          : undefined;
      const thumbnailUrl = !isVideo && m.publicId
        ? getOptimizedUrl(m.publicId, { width: 400, crop: "limit" }, cropMeta)
        : m.url;
      const fullUrl = !isVideo && m.publicId
        ? getOptimizedUrl(m.publicId, { width: 1200, crop: "limit" }, cropMeta)
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
}

export function MediaSection({ business }: { business: BusinessWithDetails }) {
  const galleryItems = buildGalleryItems(business.media);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery</CardTitle>
        {galleryItems.length > 0 && (
          <CardDescription>
            {galleryItems.length} item{galleryItems.length !== 1 ? "s" : ""}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {galleryItems.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-purple">
              <ImageIcon className="size-6 text-brand-purple-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">No photos yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This business hasn&apos;t uploaded portfolio images yet.
            </p>
          </div>
        ) : (
          <GalleryLightbox items={galleryItems} />
        )}
      </CardContent>
    </Card>
  );
}
