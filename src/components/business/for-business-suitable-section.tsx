"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const businessTypes = [
  {
    title: "Kuaför & Saç Salonu",
    image: "/business/suitable-hair.svg",
  },
  {
    title: "Kaş & Kirpik Stüdyosu",
    image: "/business/suitable-brow.svg",
  },
  {
    title: "Nail Salon",
    image: "/business/suitable-nail.svg",
  },
  {
    title: "Barber Shop",
    image: "/business/suitable-barber.svg",
  },
  {
    title: "Cilt Bakımı",
    image: "/business/suitable-skin.svg",
  },
  {
    title: "Spa & Masaj",
    image: "/business/suitable-spa.svg",
  },
  {
    title: "Lazer Epilasyon",
    image: "/business/suitable-skin.svg",
  },
  {
    title: "Makyaj Stüdyosu",
    image: "/business/suitable-brow.svg",
  },
];

const scrollingBusinessTypes = [...businessTypes, ...businessTypes];

function normalizeOffset(offset: number, width: number) {
  if (width <= 0) {
    return offset;
  }

  return ((offset % width) + width) % width;
}

export function ForBusinessSuitableSection() {
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
    <section className="overflow-hidden border-t bg-background px-4 py-16 md:py-24">
      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Her güzellik işletmesi için uygun
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Kuaförden nail salona, barber shop&apos;tan spa merkezine kadar tüm
            ekipler randevu, müşteri ve operasyonlarını UrGlowUp ile tek yerden
            yönetebilir.
          </p>
        </div>
      </div>

      <div
        className="business-suitable-mask mt-10 overflow-hidden md:mt-14"
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
          className="flex w-max touch-pan-y gap-5 py-2 pr-5 will-change-transform"
        >
          {scrollingBusinessTypes.map((type, index) => (
            <article
              aria-hidden={index >= businessTypes.length}
              className="group relative h-48 w-[78vw] max-w-[360px] shrink-0 cursor-grab select-none overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border/70 active:cursor-grabbing sm:w-[330px] md:h-56 md:w-[380px]"
              key={`${type.title}-${index}`}
            >
              <Image
                src={type.image}
                alt=""
                fill
                sizes="(min-width: 768px) 380px, 78vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
              <h3 className="absolute bottom-5 left-5 right-5 text-xl font-bold tracking-normal text-white md:text-2xl">
                {type.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
