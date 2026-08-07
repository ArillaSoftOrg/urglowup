"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Heart,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryItem, GalleryService } from "./business-gallery-hero";

interface PortfolioMediaViewerProps {
  items: GalleryItem[];
  initialIndex: number;
  businessSlug: string;
  businessName: string;
  isLoggedIn: boolean;
  onClose: () => void;
}

function isSaleActive(service: GalleryService) {
  if (service.salePrice == null) return false;
  if (!service.saleEndsAt) return true;
  return new Date(service.saleEndsAt).getTime() > Date.now();
}

function formatPrice(service: GalleryService): {
  primary: string | null;
  secondary: string | null;
  savings: string | null;
} {
  if (service.priceType === "FREE_CONSULTATION") {
    return { primary: "Ücretsiz danışma", secondary: null, savings: null };
  }
  if (service.priceType === "CONSULTATION_REQUIRED") {
    return { primary: "Fiyat için danışın", secondary: null, savings: null };
  }
  if (service.price == null) {
    return { primary: null, secondary: null, savings: null };
  }

  const base = Number(service.price);
  const sale = service.salePrice == null ? null : Number(service.salePrice);
  const prefix = service.priceType === "STARTS_FROM" ? "itibaren " : "";

  if (sale != null && Number.isFinite(sale) && isSaleActive(service)) {
    const savings =
      Number.isFinite(base) && base > sale
        ? `%${Math.round(((base - sale) / base) * 100)} tasarruf edin`
        : null;
    return {
      primary: `${prefix}₺${sale}`,
      secondary: Number.isFinite(base) ? `₺${base}` : null,
      savings,
    };
  }

  return {
    primary: Number.isFinite(base) ? `${prefix}₺${base}` : null,
    secondary: null,
    savings: null,
  };
}

function PortfolioVideo({ item, isActive }: { item: GalleryItem; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <>
      <video
        ref={videoRef}
        src={item.url}
        poster={item.posterUrl}
        className="max-h-full max-w-full object-contain"
        autoPlay
        muted={muted}
        loop
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="absolute left-4 top-16 flex gap-2">
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) video.play().catch(() => {});
            else video.pause();
          }}
          className="flex size-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
          <span className="sr-only">{playing ? "Duraklat" : "Oynat"}</span>
        </button>
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          className="flex size-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          <span className="sr-only">{muted ? "Sesi aç" : "Sesi kapat"}</span>
        </button>
      </div>
    </>
  );
}

export function PortfolioMediaViewer({
  items,
  initialIndex,
  businessSlug,
  businessName,
  isLoggedIn,
  onClose,
}: PortfolioMediaViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [mediaState, setMediaState] = useState(() =>
    items.map((item) => ({
      id: item.id,
      liked: item.likedByCurrentUser,
      likeCount: item.likeCount,
    })),
  );
  const [sharedId, setSharedId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  const activeItem = items[activeIndex] ?? items[0];

  const goTo = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(index, items.length - 1));
      slideRefs.current[bounded]?.scrollIntoView({
        inline: "start",
        block: "nearest",
        behavior: "smooth",
      });
      setActiveIndex(bounded);
    },
    [items.length],
  );

  useEffect(() => {
    const y = window.scrollY;
    document.body.style.cssText = `overflow:hidden;position:fixed;top:-${y}px;width:100%`;
    history.pushState({ portfolioViewer: true }, "");

    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);

    requestAnimationFrame(() => {
      slideRefs.current[initialIndex]?.scrollIntoView({
        inline: "start",
        block: "nearest",
      });
    });

    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.cssText = "";
      window.scrollTo(0, y);
    };
  }, [initialIndex, onClose]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = Number(visible?.target.getAttribute("data-index"));
        if (Number.isFinite(index)) setActiveIndex(index);
      },
      { root, threshold: [0.55, 0.75] },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Backspace") {
        history.back();
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goTo(activeIndex - 1);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  const stateById = useMemo(
    () => new Map(mediaState.map((item) => [item.id, item])),
    [mediaState],
  );

  async function toggleLike(item: GalleryItem) {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    const current = stateById.get(item.id);
    const nextLiked = !current?.liked;
    const nextCount = Math.max(0, (current?.likeCount ?? 0) + (nextLiked ? 1 : -1));

    setMediaState((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? { ...row, liked: nextLiked, likeCount: nextCount }
          : row,
      ),
    );

    try {
      const response = await fetch(`/api/media/${item.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
      if (!response.ok) throw new Error("Like failed");
      const data = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };
      setMediaState((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, liked: data.liked, likeCount: data.likeCount }
            : row,
        ),
      );
    } catch {
      setMediaState((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, liked: current?.liked ?? false, likeCount: current?.likeCount ?? 0 }
            : row,
        ),
      );
    }
  }

  async function shareItem(item: GalleryItem) {
    const url = `${window.location.origin}/b/${businessSlug}?media=${item.id}#portfolio`;
    const title = item.relatedService?.name
      ? `${item.relatedService.name} - ${businessName}`
      : businessName;

    if (typeof navigator.share === "function") {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }

    await navigator.clipboard.writeText(url);
    setSharedId(item.id);
    window.setTimeout(() => setSharedId(null), 1800);
  }

  if (!activeItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Portföy görsel izleyici"
      className="fixed inset-0 z-[100] bg-black text-white"
    >
      <button
        type="button"
        onClick={() => history.back()}
        className="absolute left-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-5" />
        <span className="sr-only">Geri</span>
      </button>

      <div className="absolute right-4 top-4 z-20 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
        {activeIndex + 1} / {items.length}
      </div>

      <div
        ref={scrollerRef}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => {
          const service = item.relatedService;
          const price = service ? formatPrice(service) : null;
          const current = stateById.get(item.id);
          const aspect =
            item.width && item.height ? `${item.width} / ${item.height}` : undefined;

          return (
            <section
              key={item.id}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              data-index={index}
              className="relative flex h-[100dvh] w-screen shrink-0 snap-start items-center justify-center overflow-hidden bg-black px-0"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {item.isVideo ? (
                  <PortfolioVideo item={item} isActive={activeIndex === index} />
                ) : aspect ? (
                  <div
                    className="relative max-h-full w-full max-w-[min(100vw,760px)]"
                    style={{ aspectRatio: aspect }}
                  >
                    <Image
                      src={item.url}
                      alt={item.title ?? service?.name ?? "Portföy görseli"}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority={index === initialIndex}
                    />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.title ?? service?.name ?? "Portföy görseli"}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-t from-black via-black/70 to-transparent" />

              <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-5 sm:right-5">
                <button
                  type="button"
                  onClick={() => toggleLike(item)}
                  className="group flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 text-white focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Heart
                    className={cn(
                      "size-7 drop-shadow transition group-hover:scale-110",
                      current?.liked && "fill-white",
                    )}
                  />
                  <span className="text-xs font-bold tabular-nums">
                    {current?.likeCount ?? 0}
                  </span>
                  <span className="sr-only">Görseli beğen</span>
                </button>

                <button
                  type="button"
                  onClick={() => shareItem(item)}
                  className="group flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 text-white focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {sharedId === item.id ? (
                    <Check className="size-7 drop-shadow" />
                  ) : (
                    <Share2 className="size-7 fill-white drop-shadow transition group-hover:scale-110" />
                  )}
                  <span className="text-xs font-bold">0</span>
                  <span className="sr-only">Görseli paylaş</span>
                </button>
              </div>

              {service && (
                <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
                  <div className="flex max-w-3xl items-end justify-between gap-4">
                    <div className="min-w-0 text-white">
                      <p className="line-clamp-2 text-base font-bold leading-tight sm:text-lg">
                        {service.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {service.durationMinutes} dk.
                      </p>
                      {price?.primary && (
                        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-bold">{price.primary}</span>
                          {price.secondary && (
                            <span className="text-sm text-white/65 line-through">
                              {price.secondary}
                            </span>
                          )}
                        </div>
                      )}
                      {price?.savings && (
                        <p className="mt-0.5 text-sm font-medium text-success">
                          {price.savings}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/b/${businessSlug}/book?service=${service.id}`}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-black shadow-lg transition hover:bg-white/90 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-6"
                    >
                      <CalendarCheck className="size-4" />
                      Rezervasyon yap
                    </Link>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
