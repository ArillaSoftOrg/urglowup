import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

// Deterministic gradient based on business name initial
const COVER_GRADIENTS = [
  "from-pink-100 to-rose-200",
  "from-purple-100 to-violet-200",
  "from-sky-100 to-blue-200",
  "from-amber-100 to-orange-200",
  "from-teal-100 to-emerald-200",
  "from-fuchsia-100 to-pink-200",
];

function pickGradient(name: string): string {
  const index = name.charCodeAt(0) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[index];
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  const rounded = Math.round(avg * 10) / 10;
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="size-3 fill-amber-400 text-amber-400" />
      <span className="font-medium text-foreground">{rounded.toFixed(1)}</span>
      <span>·</span>
      <span>{count} değerlendirme</span>
    </div>
  );
}

export function BusinessCard({ business }: { business: MarketplaceBusiness }) {
  const { name, slug, coverImageUrl, logoUrl, city, district, categories, reviewCount, reviewAvg } = business;
  const gradient = pickGradient(name);
  const visibleCategories = categories.slice(0, 2);
  const locationParts = [district, city].filter(Boolean);

  return (
    <Link
      href={`/b/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${name} kapak görseli`}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`size-full bg-gradient-to-br ${gradient}`}
          />
        )}

        {/* Logo overlay */}
        {logoUrl && (
          <div className="absolute bottom-2 left-3 size-10 overflow-hidden rounded-lg border-2 border-background bg-background shadow-sm">
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="size-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <p className="truncate font-semibold leading-tight">{name}</p>

        {visibleCategories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleCategories.map(({ category }) => (
              <Badge key={category.slug} variant="neutral" className="text-xs">
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          {reviewCount > 0 && reviewAvg !== null ? (
            <StarRating avg={reviewAvg} count={reviewCount} />
          ) : (
            <span className="text-xs text-muted-foreground">Henüz değerlendirme yok</span>
          )}

          {locationParts.length > 0 && (
            <div className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span className="max-w-[100px] truncate">
                {locationParts.join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
