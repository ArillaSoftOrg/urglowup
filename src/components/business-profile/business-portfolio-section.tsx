"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronDown, ImageIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "./business-gallery-hero";

const PortfolioMediaViewer = dynamic(
  () =>
    import("./portfolio-media-viewer").then((mod) => mod.PortfolioMediaViewer),
  {
    loading: () => <div className="fixed inset-0 z-[100] bg-black" />,
  },
);

interface BusinessForLightbox {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  slug: string;
  services: Array<{
    id: string;
    name: string;
    price: unknown;
    priceType: string;
    durationMinutes: number;
  }>;
}

const VISIBLE_COUNT = 5;
const MOBILE_VISIBLE_COUNT = 9;

function PortfolioTile({
  item,
  index,
  showOverlay,
  remaining,
  className,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  showOverlay: boolean;
  remaining: number;
  className?: string;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className,
      )}
    >
      {item.isVideo ? (
        <>
          <video
            src={item.thumbnailUrl}
            poster={item.posterUrl}
            className="size-full object-cover"
            muted
            playsInline
            preload="none"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
            <span className="flex size-10 items-center justify-center rounded-full bg-background/95 shadow-sm">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
          </span>
        </>
      ) : (
        <Image
          src={item.thumbnailUrl}
          alt={item.title ?? "Portföy görseli"}
          fill
          sizes={
            index === 0
              ? "(max-width: 768px) 100vw, 50vw"
              : "(max-width: 768px) 50vw, 25vw"
          }
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      )}

      {showOverlay && remaining > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-2xl font-bold text-background lg:text-3xl">
          +{remaining}
        </span>
      )}
    </button>
  );
}

export function BusinessPortfolioSection({
  items,
  business,
  isLoggedIn = false,
}: {
  items: GalleryItem[];
  business: BusinessForLightbox;
  isLoggedIn?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const visibleItems = items.slice(0, VISIBLE_COUNT);
  const mobileVisibleItems = showAllMobile
    ? items
    : items.slice(0, MOBILE_VISIBLE_COUNT);
  const remaining = Math.max(items.length - VISIBLE_COUNT, 0);
  const current = openIndex !== null ? items[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);

  if (items.length === 0) return null;

  const [featured, ...rest] = visibleItems;
  const isSingle = visibleItems.length === 1;

  return (
    <>
      <section id="portfolio" className="scroll-mt-[106px] border-t border-border/70 pt-8 md:scroll-mt-[130px] md:pt-10">
        <div className="mb-5 flex items-center gap-2.5">
          <h2 className="text-2xl font-bold tracking-normal">Portföy</h2>
          <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 md:hidden">
          {mobileVisibleItems.map((item, index) => (
            <PortfolioTile
              key={item.id}
              item={item}
              index={index}
              showOverlay={false}
              remaining={0}
              className="aspect-square rounded-xl"
              onOpen={setOpenIndex}
            />
          ))}
        </div>

        {items.length > MOBILE_VISIBLE_COUNT && !showAllMobile && (
          <button
            type="button"
            onClick={() => setShowAllMobile(true)}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-bold text-foreground shadow-xs transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden"
          >
            Tümünü gör
            <ChevronDown className="size-4" />
          </button>
        )}

        <div className="hidden grid-cols-2 gap-2 sm:gap-2.5 md:grid md:h-[380px] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
          {featured && (
            <PortfolioTile
              item={featured}
              index={0}
              showOverlay={isSingle}
              remaining={remaining}
              className={cn(
                "col-span-2 aspect-video",
                isSingle
                  ? "md:col-span-3 md:row-span-2 md:aspect-auto md:h-full"
                  : "md:col-auto md:row-span-2 md:aspect-auto md:h-full",
              )}
              onOpen={setOpenIndex}
            />
          )}

          {rest.map((item, i) => {
            const realIndex = i + 1;
            const isLast = realIndex === visibleItems.length - 1;
            return (
              <PortfolioTile
                key={item.id}
                item={item}
                index={realIndex}
                showOverlay={isLast}
                remaining={remaining}
                className="aspect-square md:aspect-auto md:h-full"
                onOpen={setOpenIndex}
              />
            );
          })}
        </div>

        {items.length > VISIBLE_COUNT && (
          <button
            type="button"
            onClick={() => setOpenIndex(VISIBLE_COUNT - 1)}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-full border bg-background px-4 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <ImageIcon className="size-4" />
            Tüm fotoğrafları gör
          </button>
        )}
      </section>

      {current && (
        <PortfolioMediaViewer
          items={items}
          initialIndex={openIndex ?? 0}
          businessSlug={business.slug}
          businessName={business.name}
          isLoggedIn={isLoggedIn}
          onClose={close}
        />
      )}
    </>
  );
}
