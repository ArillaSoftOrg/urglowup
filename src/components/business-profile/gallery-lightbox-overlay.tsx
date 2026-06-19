"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryItem {
  id: string;
  url: string;
  title: string | null;
  width: number | null;
  height: number | null;
  isVideo: boolean;
}

interface GalleryLightboxOverlayProps {
  current: GalleryItem;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function GalleryLightboxOverlay({
  current,
  currentIndex,
  total,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: GalleryLightboxOverlayProps) {
  const currentAspect =
    current.width && current.height ? current.width / current.height : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-primary-foreground hover:bg-primary-foreground/20"
        onClick={onClose}
      >
        <X className="size-6" />
      </Button>

      {total > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            disabled={!hasPrev}
          >
            <ChevronLeft className="size-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            disabled={!hasNext}
          >
            <ChevronRight className="size-8" />
          </Button>
        </>
      )}

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
        ) : currentAspect ? (
          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            style={{
              aspectRatio: `${current.width} / ${current.height}`,
              width: `min(90vw, ${(85 * currentAspect).toFixed(2)}vh)`,
            }}
          >
            <Image
              key={current.id}
              src={current.url}
              alt={current.title ?? "Portfolio"}
              fill
              sizes="100vw"
              className="rounded-lg object-contain"
            />
          </div>
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
          <p className="mt-2 text-center text-sm text-primary-foreground/80">
            {current.title}
          </p>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-primary-foreground/60">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}
