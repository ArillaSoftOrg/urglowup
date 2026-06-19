import Image from "next/image";
import { Sparkles } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl } from "@/lib/cloudinary";

function optimizeCoverUrl(media: BusinessWithDetails["media"][number] | undefined, url: string | null) {
  if (media?.publicId) {
    const cropMeta = media.cropX != null
      ? { x: media.cropX, y: media.cropY!, width: media.cropWidth!, height: media.cropHeight! }
      : undefined;
    return {
      desktop: getOptimizedUrl(media.publicId, { width: 1200, crop: "limit" }, cropMeta),
      mobile: getOptimizedUrl(media.publicId, { width: 800, crop: "limit" }, cropMeta),
    };
  }
  if (url) return { desktop: url, mobile: url };
  return null;
}

function optimizeLogoUrl(media: BusinessWithDetails["media"][number] | undefined, url: string | null) {
  if (media?.publicId) {
    return getOptimizedUrl(media.publicId, { width: 256, crop: "limit" });
  }
  return url;
}

export function CoverSection({ business }: { business: BusinessWithDetails }) {
  const coverMedia = business.media.find((m) => m.type === "COVER");
  const logoMedia = business.media.find((m) => m.type === "LOGO");

  const coverUrls = optimizeCoverUrl(coverMedia, business.coverImageUrl);
  const logoUrl = optimizeLogoUrl(logoMedia, business.logoUrl);

  return (
    <div className="relative">
      {/* Cover image or gradient fallback */}
      <div className="relative aspect-[16/9] w-full">
        {coverUrls ? (
          <Image
            src={coverUrls.desktop}
            alt={`${business.name} cover`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-surface-pink via-surface-purple to-surface-cream" />
        )}
        {/* Gradient overlay anchors the logo and softens the bottom edge */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Logo / Avatar overlay */}
      <div className="container mx-auto px-4">
        <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
          {logoUrl ? (
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg ring-4 ring-background">
              <Image
                src={logoUrl}
                alt={`${business.name} logo`}
                fill
                sizes="(max-width: 640px) 112px, 128px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex size-28 items-center justify-center rounded-2xl bg-surface-cream shadow-lg ring-4 ring-background sm:size-32">
              <Sparkles className="size-10 text-brand-pink-foreground sm:size-12" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
