"use client";

import Link from "next/link";
import Image from "next/image";
import { rememberBusinessView } from "@/lib/recent-business-history";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

// Deterministic gradient based on business name initial — uses design tokens
const COVER_GRADIENTS = [
  "from-surface-pink to-brand-pink",
  "from-surface-purple to-brand-purple",
  "from-surface-cream to-brand-cream",
  "from-brand-pink/30 to-brand-purple/40",
  "from-brand-cream/60 to-surface-pink",
  "from-surface-purple/60 to-surface-cream",
];

function pickGradient(name: string): string {
  const index = name.charCodeAt(0) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[index];
}

export function BusinessCard({
  business,
  locale,
}: {
  business: MarketplaceBusiness;
  locale?: string;
}) {
  const { name, slug, coverImageUrl, city, district, categories, reviewCount, reviewAvg } = business;
  const gradient = pickGradient(name);
  const firstCategory = categories[0]?.category ?? null;
  const locationLabel = district || city || null;
  const prefix = locale && locale !== "tr" ? `/${locale}` : "";

  return (
    <Link
      href={`${prefix}/b/${slug}`}
      data-business-id={business.id}
      onClick={() => rememberBusinessView(business.id)}
      className="group flex flex-col transition-transform active:scale-[0.98]"
    >
      {/* Media tile */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={`${name} kapak görseli`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
        {reviewCount === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
            Yeni
          </span>
        )}
      </div>

      {/* Text block */}
      <div className="flex flex-col gap-1 pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-tight">{name}</p>
          {reviewCount > 0 && reviewAvg !== null && (
            <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
              {(Math.round(reviewAvg * 10) / 10).toFixed(1)}
              <span className="text-muted-foreground"> / 10</span>
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
