import { Sparkles } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl } from "@/lib/cloudinary";

function optimizeCoverUrl(media: BusinessWithDetails["media"][number] | undefined, url: string | null) {
  if (media?.publicId) {
    return {
      desktop: getOptimizedUrl(media.publicId, { width: 1200, crop: "limit" }),
      mobile: getOptimizedUrl(media.publicId, { width: 800, crop: "limit" }),
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
      <div className="relative h-56 sm:h-72 lg:h-80">
        {coverUrls ? (
          <picture className="block size-full">
            <source media="(min-width: 640px)" srcSet={coverUrls.desktop} />
            <img
              src={coverUrls.mobile}
              alt={`${business.name} cover`}
              className="size-full object-cover"
            />
          </picture>
        ) : (
          <div className="size-full bg-gradient-to-br from-[oklch(0.88_0.06_10)] via-[oklch(0.91_0.04_300)] to-[oklch(0.97_0.01_85)]" />
        )}
        {/* Gradient overlay anchors the logo and softens the bottom edge */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Logo / Avatar overlay */}
      <div className="container mx-auto px-4">
        <div className="-mt-14 flex items-end gap-4 sm:-mt-16">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${business.name} logo`}
              className="size-28 rounded-2xl object-cover shadow-lg ring-4 ring-background sm:size-32"
            />
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
