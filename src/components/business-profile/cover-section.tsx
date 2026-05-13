import { Building2 } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl } from "@/lib/cloudinary";

function optimizeCoverUrl(media: BusinessWithDetails["media"][number] | undefined, url: string | null) {
  // Use media publicId for Cloudinary transforms if available
  if (media?.publicId) {
    return {
      desktop: getOptimizedUrl(media.publicId, { width: 1200, crop: "limit" }),
      mobile: getOptimizedUrl(media.publicId, { width: 800, crop: "limit" }),
    };
  }
  // Fallback to raw URL (non-Cloudinary or legacy)
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
      {coverUrls ? (
        <div className="h-48 sm:h-64 lg:h-72">
          <picture>
            <source media="(min-width: 640px)" srcSet={coverUrls.desktop} />
            <img
              src={coverUrls.mobile}
              alt={`${business.name} cover`}
              className="size-full object-cover"
            />
          </picture>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-pink via-brand-purple to-brand-cream sm:h-64 lg:h-72" />
      )}

      {/* Logo / Avatar overlay */}
      <div className="container mx-auto px-4">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-16">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${business.name} logo`}
              className="size-24 rounded-2xl border-4 border-background object-cover shadow-lg sm:size-32"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-background bg-muted shadow-lg sm:size-32">
              <Building2 className="size-10 text-muted-foreground sm:size-12" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
