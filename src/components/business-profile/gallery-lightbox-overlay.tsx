"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  url: string;
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

interface GalleryLightboxOverlayProps {
  current: GalleryItem;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  business?: BusinessForLightbox;
}

type ActiveTab = "gallery" | "location" | "services";

const TAB_LABELS: Record<ActiveTab, string> = {
  gallery: "Görsel galerisi",
  location: "Yer",
  services: "Hizmetler",
};

function formatServicePrice(s: BusinessForLightbox["services"][number]): string | null {
  if (s.priceType === "FREE_CONSULTATION") return "Ücretsiz danışma";
  if (s.priceType === "CONSULTATION_REQUIRED") return "Fiyat için danışın";
  if (s.price == null) return null;
  const amount = `₺${Number(s.price)}`;
  return s.priceType === "STARTS_FROM" ? `${amount} itibaren` : amount;
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
  business,
}: GalleryLightboxOverlayProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("gallery");

  const currentAspect =
    current.width && current.height ? current.width / current.height : null;

  const addressParts = business
    ? [business.address, business.district, business.city].filter(Boolean)
    : [];
  const mapsQuery = addressParts.join(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Tab bar */}
      {business && (
        <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-black/50 p-1">
          {(["gallery", "location", "services"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white",
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 text-primary-foreground hover:bg-primary-foreground/20"
        onClick={onClose}
      >
        <X className="size-6" />
      </Button>

      {/* Gallery nav arrows — only on gallery tab */}
      {total > 1 && activeTab === "gallery" && (
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

      {/* Gallery tab content */}
      {activeTab === "gallery" && (
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
      )}

      {/* Location tab content */}
      {activeTab === "location" && business && (
        <div
          className="flex flex-col items-center gap-5 text-center text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="size-10 text-white/60" />
          {addressParts.length > 0 ? (
            <p className="max-w-sm text-lg leading-relaxed">
              {addressParts.join(", ")}
            </p>
          ) : (
            <p className="text-white/50">Adres bilgisi mevcut değil</p>
          )}
          {mapsQuery && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              Adres tarifi alın
            </a>
          )}
        </div>
      )}

      {/* Services tab content */}
      {activeTab === "services" && business && (
        <div
          className="max-h-[70vh] w-full max-w-md overflow-y-auto space-y-2 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {business.services.length === 0 ? (
            <p className="text-center text-white/50">Hizmet bilgisi mevcut değil</p>
          ) : (
            business.services.map((s) => {
              const price = formatServicePrice(s);
              return (
                <div key={s.id} className="rounded-xl bg-white/10 px-4 py-3 text-white">
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-sm text-white/60">
                    {s.durationMinutes} dk{price ? ` · ${price}` : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Gallery counter — only on gallery tab */}
      {activeTab === "gallery" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-primary-foreground/60">
          {currentIndex + 1} / {total}
        </div>
      )}
    </div>
  );
}
