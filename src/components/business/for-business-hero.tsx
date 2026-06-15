"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
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
          {panels.map((panel, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={panel.tab}
                type="button"
                aria-current={isActive}
                onClick={() => {
                  setActiveIndex(index);
                  setProgress(0);
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

      <div className="business-panel-mask mx-[calc(50%-50vw)] mt-7 h-[300px] overflow-hidden pb-10 sm:h-[390px] lg:h-[470px]">
        <div className="relative h-full">
          {panels.map((panel, index) => {
            const offset = getRelativePanelIndex(index, activeIndex);
            const isActive = offset === 0;

            return (
              <div
                aria-hidden={!isActive}
                key={panel.tab}
                className="absolute bottom-10 left-1/2 overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_24px_70px_oklch(0.25_0.08_300/0.20)] transition-all duration-700 ease-out"
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
