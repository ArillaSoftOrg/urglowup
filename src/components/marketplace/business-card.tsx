import Link from "next/link";
import Image from "next/image";
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

export function BusinessCard({ business }: { business: MarketplaceBusiness }) {
  const { name, slug, coverImageUrl, city, district, categories, reviewCount, reviewAvg } = business;
  const gradient = pickGradient(name);
  const firstCategory = categories[0]?.category ?? null;
  const locationLabel = district || city || null;

  return (
    <Link
      href={`/b/${slug}`}
      className="group flex flex-col transition-transform active:scale-[0.98]"
    >
      {/* Media tile */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={`${name} kapak görseli`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
        {reviewCount === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
            Yeni
          </span>
        )}
      </div>

      {/* Text block */}
      <div className="flex flex-col gap-1 pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-tight">{name}</p>
          {reviewCount > 0 && reviewAvg !== null && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-foreground">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {(Math.round(reviewAvg * 10) / 10).toFixed(1)}
            </span>
          )}
        </div>
        {(firstCategory || locationLabel) && (
          <p className="truncate text-xs text-muted-foreground">
            {[firstCategory?.name, locationLabel].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
