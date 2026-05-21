"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string | null;
  isVideo: boolean;
}

export function GalleryLightbox({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i !== null ? (i - 1 + items.length) % items.length : null
      ),
    [items.length]
  );
  const next = useCallback(
    () =>
      setOpenIndex((i) => (i !== null ? (i + 1) % items.length : null)),
    [items.length]
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
  }, [openIndex, close, prev, next]);

  if (items.length === 0) return null;

  const current = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white/90">
                    <svg
                      className="ml-0.5 size-4 text-black"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <Image
                src={item.thumbnailUrl}
                alt={item.title ?? "Portfolio"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            )}
            {item.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{item.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={close}
          >
            <X className="size-6" />
          </Button>

          {/* Navigation */}
          {items.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
              >
                <ChevronLeft className="size-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
              >
                <ChevronRight className="size-8" />
              </Button>
            </>
          )}

          {/* Content */}
          <div
            className="max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {current.isVideo ? (
              <video
                key={current.id}
                src={current.url}
                className="max-h-[85vh] max-w-[90vw] rounded-lg"
                controls
                autoPlay
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={current.id}
                src={current.url}
                alt={current.title ?? "Portfolio"}
                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              />
            )}
            {current.title && (
              <p className="mt-2 text-center text-sm text-white/80">
                {current.title}
              </p>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {openIndex! + 1} / {items.length}
          </div>
        </div>
      )}
    </>
  );
}
