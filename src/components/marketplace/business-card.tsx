import Link from "next/link";
import { Star } from "lucide-react";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

// Deterministic gradient based on business name initial — softer tones
const COVER_GRADIENTS = [
  "from-rose-200 to-pink-300",
  "from-purple-200 to-violet-300",
  "from-sky-200 to-blue-300",
  "from-amber-200 to-orange-300",
  "from-teal-200 to-emerald-300",
  "from-stone-200 to-zinc-300",
];

function pickGradient(name: string): string {
  const index = name.charCodeAt(0) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[index];
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  const rounded = Math.round(avg * 10) / 10;
  return (
    <span className="flex shrink-0 items-center gap-1">
      <Star className="size-3 fill-amber-400 text-amber-400" />
      <span className="font-medium text-foreground">{rounded.toFixed(1)}</span>
      <span>·</span>
      <span>{count} yorum</span>
    </span>
  );
}

export function BusinessCard({ business }: { business: MarketplaceBusiness }) {
  const { name, slug, coverImageUrl, city, district, categories, reviewCount, reviewAvg } = business;
  const gradient = pickGradient(name);
  const firstCategory = categories[0]?.category ?? null;
  const locationLabel = district || city || null;

  return (
    <Link
      href={`/b/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      {/* Media — aspect-ratio driven, no logo overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${name} kapak görseli`}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold leading-tight">{name}</p>

        {firstCategory && (
          <span className="inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {firstCategory.name}
          </span>
        )}

        {/* Single-line metadata: rating/status · location */}
        <p className="mt-auto flex items-center gap-1 truncate text-xs text-muted-foreground">
          {reviewCount > 0 && reviewAvg !== null ? (
            <StarRating avg={reviewAvg} count={reviewCount} />
          ) : (
            <span className="shrink-0">Yeni işletme</span>
          )}
          {locationLabel && (
            <>
              <span className="shrink-0">·</span>
              <span className="truncate">{locationLabel}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
