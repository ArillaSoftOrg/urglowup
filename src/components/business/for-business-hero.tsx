"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 5200;

const panels = [
  {
    tab: "Takvim",
    src: "/business/panel-appointments.png",
    alt: "UrGlowUp randevu paneli haftalık takvim görünümü",
  },
  {
    tab: "Çevrimiçi Rezervasyon",
    src: "/business/panel-appointments.png",
    alt: "UrGlowUp çevrimiçi rezervasyon paneli görünümü",
  },
  {
    tab: "Satışlar ve Ödemeler",
    src: "/business/panel-appointments.png",
    alt: "UrGlowUp satışlar ve ödemeler paneli görünümü",
  },
  {
    tab: "Aramalar ve Mesajlar",
    src: "/business/panel-messages.png",
    alt: "UrGlowUp işletme paneli mesajlar ve müşteri detayları görünümü",
  },
  {
    tab: "Pazarlama",
    src: "/business/panel-messages.png",
    alt: "UrGlowUp pazarlama ve müşteri iletişimi paneli görünümü",
  },
] as const;

function getRelativePanelIndex(index: number, activeIndex: number) {
  let offset = index - activeIndex;
  const midpoint = panels.length / 2;

  if (offset > midpoint) {
    offset -= panels.length;
  }

  if (offset < -midpoint) {
    offset += panels.length;
  }

  return offset;
}

export function ForBusinessHero({ registerHref }: { registerHref: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef(0);

  const goToPanel = (index: number) => {
    setActiveIndex((index + panels.length) % panels.length);
    setProgress(0);
  };

  const goPrevious = () => {
    goToPanel(activeIndex - 1);
  };

  const goNext = () => {
    goToPanel(activeIndex + 1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartXRef.current = event.clientX;
    dragDeltaXRef.current = 0;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current === null) {
      return;
    }

    dragDeltaXRef.current = event.clientX - dragStartXRef.current;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const delta = dragDeltaXRef.current;
    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;

    if (Math.abs(delta) < 52) {
      return;
    }

    if (delta < 0) {
      goNext();
    } else {
      goPrevious();
    }
  };

  useEffect(() => {
    const startedAt = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const nextProgress = Math.min((time - startedAt) / AUTO_ADVANCE_MS, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        setActiveIndex((current) => (current + 1) % panels.length);
        setProgress(0);
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [activeIndex]);

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,oklch(0.995_0.004_300),oklch(0.97_0.022_315)_58%,oklch(0.86_0.095_315))] px-4 pb-0 pt-14 text-center md:pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_50%_0%,oklch(0.99_0.004_300)_0%,oklch(0.99_0.004_300/0.82)_42%,transparent_72%)]" />
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-900/72">
          Neden farklıyız?
        </p>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-normal text-slate-950 md:text-6xl">
          Salon ve spa yazılımı, sonunda doğru yapıldı
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-800 md:text-lg">
          Çoğu salon ve spa yazılımı ekiplerin hızını keser. UrGlowUp,
          randevudan mesaja, müşteriden panele kadar işletmenin her gün
          kullanacağı akışları daha sade, daha hızlı ve daha kârlı hale getirir.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href="#why-different"
            className={cn(
              buttonVariants({ size: "lg" }),
              "gap-2 rounded-full bg-fuchsia-700 px-8 text-white hover:bg-fuchsia-800"
            )}
          >
            Neden farklı olduğumuzu gör
            <ArrowDown aria-hidden="true" className="h-4 w-4" />
          </a>
          <a
            href="#panel-preview"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700 transition-colors hover:text-fuchsia-900"
          >
            <PlayCircle aria-hidden="true" className="h-4 w-4" />
            Bir video turu izleyin
          </a>
          <Link
            href={registerHref}
            className="text-sm font-bold text-slate-800 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-950"
          >
            Hemen ücretsiz başla
          </Link>
        </div>

        <div
          id="panel-preview"
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {panels.map((panel, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={panel.tab}
                type="button"
                aria-current={isActive}
                onClick={() => {
                  goToPanel(index);
                }}
                className={cn(
                  "relative isolate overflow-hidden rounded-full border border-white/35 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 backdrop-blur-sm transition-colors",
                  isActive ? "text-slate-950 shadow-sm" : "bg-white/24"
                )}
              >
                <span
                  className="absolute inset-y-0 left-0 -z-10 bg-white transition-[width] duration-100 ease-linear"
                  style={{ width: isActive ? `${progress * 100}%` : "0%" }}
                />
                <span
                  className={cn(
                    "absolute inset-0 -z-20",
                    isActive ? "bg-white/45" : "bg-transparent"
                  )}
                />
                {panel.tab}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="business-panel-mask mx-[calc(50%-50vw)] mt-7 h-[300px] overflow-hidden pb-10 sm:h-[390px] lg:h-[470px]"
        role="region"
        aria-label="Panel ön izlemeleri"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goPrevious();
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            goNext();
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="relative h-full">
          <button
            type="button"
            aria-label="Önceki panel"
            onClick={goPrevious}
            className="absolute left-5 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-950 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-700 md:left-10"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Sonraki panel"
            onClick={goNext}
            className="absolute right-5 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-950 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-700 md:right-10"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          {panels.map((panel, index) => {
            const offset = getRelativePanelIndex(index, activeIndex);
            const isActive = offset === 0;

            return (
              <div
                aria-hidden={!isActive}
                key={panel.tab}
                className="absolute bottom-10 left-1/2 cursor-grab select-none overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_24px_70px_oklch(0.25_0.08_300/0.20)] transition-all duration-700 ease-out active:cursor-grabbing"
                style={{
                  opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.48,
                  transform: `translate3d(calc(-50% + ${offset * 64}vw), 0, 0) scale(${isActive ? 1 : 0.88})`,
                  width: isActive ? "min(66vw, 880px)" : "min(50vw, 680px)",
                  zIndex: isActive ? 2 : 1,
                }}
              >
                <Image
                  src={panel.src}
                  alt={panel.alt}
                  width={1600}
                  height={900}
                  priority={index === 0}
                  className="h-auto w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
