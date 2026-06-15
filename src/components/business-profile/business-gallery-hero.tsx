"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ImageIcon, Play, Sparkles } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";
import { getOptimizedUrl } from "@/lib/cloudinary";

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
  title: string | null;
  width: number | null;
  height: number | null;
  isVideo: boolean;
}

function buildGalleryItems(business: BusinessWithDetails): GalleryItem[] {
  const portfolioItems = business.media
    .filter((m) => m.type !== "LOGO")
    .map((m) => {
      const isVideo = m.type === "PORTFOLIO_VIDEO";
      const cropMeta =
        !isVideo && m.cropX != null
          ? {
              x: m.cropX,
              y: m.cropY!,
              width: m.cropWidth!,
              height: m.cropHeight!,
            }
          : undefined;
      const thumbnailUrl =
        !isVideo && m.publicId
          ? getOptimizedUrl(m.publicId, { width: 700, crop: "limit" }, cropMeta)
          : m.url;
      const fullUrl =
        !isVideo && m.publicId
          ? getOptimizedUrl(m.publicId, { width: 1400, crop: "limit" })
          : m.url;

      return {
        id: m.id,
        url: fullUrl,
        thumbnailUrl,
        title: m.title,
        width: m.originalWidth,
        height: m.originalHeight,
        isVideo,
      };
    });

  if (portfolioItems.length > 0) return portfolioItems;

  if (business.coverImageUrl) {
    return [
      {
        id: "cover",
        url: business.coverImageUrl,
        thumbnailUrl: business.coverImageUrl,
        title: business.name,
        width: null,
        height: null,
        isVideo: false,
      },
    ];
  }

  return [];
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
      className={`group relative overflow-hidden rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
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
          sizes={priority ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 50vw, 28vw"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          priority={priority}
        />
      )}
    </button>
  );
}

export function BusinessGalleryHero({
  business,
}: {
  business: BusinessWithDetails;
}) {
  const items = buildGalleryItems(business);
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

  if (items.length === 0) {
    return (
      <div className="flex aspect-[16/7] min-h-72 items-center justify-center rounded-lg bg-surface-cream">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-background shadow-sm">
            <Sparkles className="size-6 text-brand-pink-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Fotograflar yakinda</p>
        </div>
      </div>
    );
  }

  const visibleItems = items.slice(0, 3);
  const current = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <section className="relative">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <MediaTile
            item={visibleItems[0]}
            index={0}
            priority
            className="aspect-[16/10] lg:aspect-[16/9]"
            onOpen={setOpenIndex}
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {visibleItems.slice(1, 3).map((item, i) => (
              <MediaTile
                key={item.id}
                item={item}
                index={i + 1}
                className="aspect-[4/3] lg:aspect-auto lg:min-h-0"
                onOpen={setOpenIndex}
              />
            ))}
            {visibleItems.length === 1 && (
              <button
                type="button"
                onClick={() => setOpenIndex(0)}
                className="flex aspect-[4/3] items-center justify-center rounded-lg border bg-background text-sm text-muted-foreground lg:aspect-auto"
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
            className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-full bg-background px-4 text-sm font-semibold text-foreground shadow-md transition hover:bg-background/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <ImageIcon className="size-4" />
            Tum fotograflar
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
        />
      )}
    </>
  );
}
