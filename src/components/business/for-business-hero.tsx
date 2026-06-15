"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const panelImages = [
  {
    src: "/business/panel-appointments.png",
    alt: "UrGlowUp randevu paneli haftalık takvim görünümü",
  },
  {
    src: "/business/panel-messages.png",
    alt: "UrGlowUp işletme paneli mesajlar ve müşteri detayları görünümü",
  },
  {
    src: "/business/panel-appointments.png",
    alt: "UrGlowUp randevu paneli takvim ve işletme özet görünümü",
  },
] as const;

const tabs = [
  "Takvim",
  "Çevrimiçi Rezervasyon",
  "Satışlar ve Ödemeler",
  "Aramalar ve Mesajlar",
  "Pazarlama",
] as const;

function normalizeOffset(offset: number, width: number) {
  if (width <= 0) {
    return offset;
  }

  return ((offset % width) + width) % width;
}

export function ForBusinessHero({ registerHref }: { registerHref: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rowWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const dragStartRef = useRef({ offset: 0, x: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const updateWidth = () => {
      rowWidthRef.current = track.scrollWidth / 2;
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(track);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (time: number) => {
      const previousTime = lastFrameRef.current ?? time;
      const delta = time - previousTime;
      const width = rowWidthRef.current;
      lastFrameRef.current = time;

      if (!isPaused && !isDragging && width > 0) {
        offsetRef.current = normalizeOffset(
          offsetRef.current - delta * 0.035,
          width
        );
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isDragging, isPaused]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      offset: offsetRef.current,
      x: event.clientX,
    };
    lastFrameRef.current = null;
    setIsPaused(true);
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    const width = rowWidthRef.current;
    const dragDistance = event.clientX - dragStartRef.current.x;
    offsetRef.current = normalizeOffset(
      dragStartRef.current.offset - dragDistance,
      width
    );
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    lastFrameRef.current = null;
    setIsDragging(false);
    setIsPaused(false);
  };

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(120deg,oklch(0.82_0.08_260),oklch(0.92_0.08_330)_55%,oklch(0.90_0.09_55))] px-4 pb-0 pt-16 text-center md:pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_50%_0%,oklch(0.99_0.004_300)_0%,oklch(0.99_0.004_300/0.82)_42%,transparent_72%)]" />
      <div className="mx-auto max-w-5xl">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-normal text-slate-950 md:text-6xl">
          Salonunuzu ve spa&apos;nızı beslemek için ihtiyacınız olan her şey
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-800 md:text-lg">
          Rezervasyon, ödemeler, otomasyonlar ve daha fazlası. Hızlı, güzel,
          sezgisel ve her cihazda çalışan tam bir platformun tadını çıkarın.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            href={registerHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-slate-950 px-7 text-white hover:bg-slate-900"
            )}
          >
            Ücretsiz Başla
          </Link>
          <a
            href="#panel-preview"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700 transition-colors hover:text-fuchsia-900"
          >
            <PlayCircle aria-hidden="true" className="h-4 w-4" />
            Bir video turu izleyin
          </a>
        </div>

        <div
          id="panel-preview"
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {tabs.map((tab, index) => (
            <span
              key={tab}
              className={cn(
                "rounded-full border border-white/35 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 backdrop-blur-sm",
                index === 2 ? "bg-white text-slate-950 shadow-sm" : "bg-white/24"
              )}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      <div
        className="business-panel-mask mx-[calc(50%-50vw)] mt-7 overflow-hidden pb-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (!isDragging) {
            lastFrameRef.current = null;
            setIsPaused(false);
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <div
          ref={trackRef}
          className="flex w-max touch-pan-y items-end gap-8 px-8 will-change-transform"
        >
          {[...panelImages, ...panelImages].map((panel, index) => (
            <div
              aria-hidden={index >= panelImages.length}
              key={`${panel.src}-${index}`}
              className={cn(
                "relative cursor-grab select-none overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_24px_70px_oklch(0.25_0.08_300/0.20)] active:cursor-grabbing",
                index % 3 === 1
                  ? "w-[min(74vw,980px)]"
                  : "w-[min(58vw,760px)] opacity-75"
              )}
            >
              <Image
                src={panel.src}
                alt={panel.alt}
                width={1600}
                height={900}
                priority={index < 2}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
