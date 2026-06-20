"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ImageIcon, Play } from "lucide-react";
import type { GalleryItem } from "./business-gallery-hero";

const GalleryLightboxOverlay = dynamic(
  () =>
    import("./gallery-lightbox-overlay").then(
      (mod) => mod.GalleryLightboxOverlay,
    ),
  {
    loading: () => <div className="fixed inset-0 z-50 bg-black/90" />,
  },
);

interface BusinessForLightbox {
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

function PortfolioTile({
  item,
  index,
  remaining,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  remaining: number;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {item.isVideo ? (
        <>
          <video
            src={item.thumbnailUrl}
            className="size-full object-cover"
            muted
            playsInline
            preload="metadata"
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
          alt={item.title ?? "Portfoy gorseli"}
          fill
          sizes="(max-width: 1024px) 25vw, 180px"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      )}

      {remaining > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/55 text-2xl font-bold text-background lg:text-3xl">
          +{remaining}
        </span>
      )}
    </button>
  );
}

export function BusinessPortfolioSection({
  items,
  business,
}: {
  items: GalleryItem[];
  business: BusinessForLightbox;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const visibleItems = items.slice(0, 10);
  const remaining = Math.max(items.length - visibleItems.length, 0);
  const current = openIndex !== null ? items[openIndex] : null;

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i !== null ? (i - 1 + items.length) % items.length : null,
      ),
    [items.length],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i !== null ? (i + 1) % items.length : null)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, next, openIndex, prev]);

  if (items.length === 0) return null;

  return (
    <>
      <section id="portfolio" className="scroll-mt-24 border-t pt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-normal">Portföy</h2>
          <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {visibleItems.map((item, index) => (
            <PortfolioTile
              key={item.id}
              item={item}
              index={index}
              remaining={index === visibleItems.length - 1 ? remaining : 0}
              onOpen={setOpenIndex}
            />
          ))}
        </div>

        {items.length > visibleItems.length && (
          <button
            type="button"
            onClick={() => setOpenIndex(visibleItems.length - 1)}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-full border bg-background px-4 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <ImageIcon className="size-4" />
            Tüm resimleri gör
          </button>
        )}
      </section>

      {current && (
        <GalleryLightboxOverlay
          current={current}
          currentIndex={openIndex ?? 0}
          total={items.length}
          onClose={close}
          onPrev={prev}
          onNext={next}
          hasPrev={items.length > 1}
          hasNext={items.length > 1}
          business={business}
        />
      )}
    </>
  );
}
