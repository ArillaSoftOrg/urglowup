"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BusinessCard } from "@/components/marketplace/business-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

interface HomeBusinessRowProps {
  id: string;
  title: string;
  businesses: MarketplaceBusiness[];
  locale?: string;
  showAllHref?: string;
  showAllLabel?: string;
  surface?: "default" | "tinted";
}

export function HomeBusinessRow({
  id,
  title,
  businesses,
  locale,
  showAllHref,
  showAllLabel,
  surface = "default",
}: HomeBusinessRowProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    setCanScrollBack(rail.scrollLeft > 8);
    setCanScrollForward(
      rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8,
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const animationFrame = window.requestAnimationFrame(updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);
    if (rail.firstElementChild) {
      resizeObserver.observe(rail.firstElementChild);
    }
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [businesses.length, updateScrollState]);

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 280),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  if (businesses.length === 0) return null;

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "py-10 md:py-14",
        surface === "tinted" && "bg-surface-purple/60",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
          <h2 id={id}>{title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            {showAllHref && showAllLabel && (
              <Link
                href={showAllHref}
                className="mr-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {showAllLabel}
              </Link>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden rounded-full sm:inline-flex"
              onClick={() => scroll(-1)}
              disabled={!canScrollBack}
              aria-label={
                locale === "tr" || !locale
                  ? `${title} içinde önceki işletmeleri göster`
                  : `Show previous businesses in ${title}`
              }
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden rounded-full sm:inline-flex"
              onClick={() => scroll(1)}
              disabled={!canScrollForward}
              aria-label={
                locale === "tr" || !locale
                  ? `${title} içinde sonraki işletmeleri göster`
                  : `Show more businesses in ${title}`
              }
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div
          ref={railRef}
          onScroll={updateScrollState}
          className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="grid w-max auto-cols-[minmax(16rem,82vw)] grid-flow-col gap-4 sm:auto-cols-[18rem] lg:auto-cols-[19rem]">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
