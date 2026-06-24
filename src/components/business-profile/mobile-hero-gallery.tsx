"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Play } from "lucide-react";
import type { GalleryItem } from "./business-gallery-hero";

const GalleryLightboxOverlay = dynamic(
  () =>
    import("./gallery-lightbox-overlay").then(
      (mod) => mod.GalleryLightboxOverlay,
    ),
  { loading: () => <div className="fixed inset-0 z-50 bg-black/90" /> },
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

export function MobileHeroGallery({
  items,
  business,
  businessName,
}: {
  items: GalleryItem[];
  business: BusinessForLightbox;
  businessName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i !== null ? (i - 1 + items.length) % items.length : null,
      ),
    [items.length],
  );
  const next = useCallback(
    () =>
      setOpenIndex((i) => (i !== null ? (i + 1) % items.length : null)),
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

  const current = openIndex !== null ? items[openIndex] : null;

  return (
    <section className="pt-3">
      {items.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label="Görselleri görüntüle"
              className="relative block aspect-[4/3] w-[86vw] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-foreground/5 transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/50"
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
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <span className="flex size-11 items-center justify-center rounded-full bg-background/95 shadow-sm">
                      <Play className="ml-0.5 size-4 fill-current" />
                    </span>
                  </span>
                </>
              ) : (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title ?? businessName}
                  fill
                  sizes="86vw"
                  className="object-cover"
                  priority={index === 0}
                />
              )}

              {items.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-foreground/80 px-3 py-1 text-sm font-bold text-background shadow-sm">
                  {index + 1}/{items.length}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="aspect-[4/3] rounded-2xl bg-surface-cream" />
        </div>
      )}

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
    </section>
  );
}
