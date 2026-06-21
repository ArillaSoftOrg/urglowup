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
  const hero = items[0];

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
    <section className="px-4 pt-3">
      <button
        type="button"
        onClick={() => hero && setOpenIndex(0)}
        disabled={!hero}
        aria-label="Görselleri görüntüle"
        className="relative block w-full aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-default"
      >
        {hero ? (
          hero.isVideo ? (
            <>
              <video
                src={hero.thumbnailUrl}
                poster={hero.posterUrl}
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
              src={hero.thumbnailUrl}
              alt={hero.title ?? businessName}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )
        ) : (
          <div className="size-full bg-surface-cream" />
        )}

        {items.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 px-3 py-1 text-sm font-bold text-background">
            1/{items.length}
          </div>
        )}
      </button>

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
