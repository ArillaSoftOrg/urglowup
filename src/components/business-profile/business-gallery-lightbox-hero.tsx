"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ImageIcon, Play } from "lucide-react";

const GalleryLightboxOverlay = dynamic(
  () =>
    import("./gallery-lightbox-overlay").then(
      (mod) => mod.GalleryLightboxOverlay,
    ),
  {
    loading: () => <div className="fixed inset-0 z-50 bg-black/90" />,
  },
);

interface GalleryItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  posterUrl?: string;
  title: string | null;
  width: number | null;
  height: number | null;
  isVideo: boolean;
}

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

function MediaTile({
  item,
  index,
  priority,
  className,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  priority?: boolean;
  className: string;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`group relative overflow-hidden rounded-[18px] bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
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
          <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/25">
            <span className="flex size-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
          </span>
        </>
      ) : (
        <Image
          src={item.thumbnailUrl}
          alt={item.title ?? "Portfolio"}
          fill
          sizes={
            priority
              ? "(max-width: 1024px) 100vw, 65vw"
              : "(max-width: 1024px) 50vw, 28vw"
          }
          className="object-cover"
          priority={priority}
        />
      )}
    </button>
  );
}

export function BusinessGalleryLightboxHero({
  items,
  business,
}: {
  items: GalleryItem[];
  business?: BusinessForLightbox;
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

  const visibleItems = items.slice(0, 3);
  const current = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <section className="relative">
        <div className="grid gap-3 md:h-[320px] md:grid-cols-[minmax(0,2fr)_minmax(180px,0.75fr)] md:gap-4 lg:h-[440px] lg:grid-cols-[minmax(0,2fr)_minmax(360px,0.96fr)] lg:gap-7 xl:h-[500px]">
          <MediaTile
            item={visibleItems[0]}
            index={0}
            priority
            className="aspect-[16/10] md:aspect-auto"
            onOpen={setOpenIndex}
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2 md:gap-4 lg:gap-7">
            {visibleItems.slice(1, 3).map((item, i) => (
              <MediaTile
                key={item.id}
                item={item}
                index={i + 1}
                className="aspect-[4/3] md:aspect-auto md:min-h-0"
                onOpen={setOpenIndex}
              />
            ))}
            {visibleItems.length === 1 && (
              <button
                type="button"
                onClick={() => setOpenIndex(0)}
                className="flex aspect-[4/3] items-center justify-center rounded-[18px] border bg-background text-sm text-muted-foreground md:aspect-auto"
              >
                <ImageIcon className="mr-2 size-4" />
                Galeri
              </button>
            )}
          </div>
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={() => setOpenIndex(0)}
            className="absolute bottom-6 right-6 inline-flex h-11 items-center gap-2 rounded-full bg-background px-5 text-sm font-semibold text-foreground shadow-md transition hover:bg-background/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
