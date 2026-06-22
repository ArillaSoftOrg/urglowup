"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface NavSection {
  id: string;
  label: string;
}

export function SectionNav({
  sections,
  className,
}: {
  sections: NavSection[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const shellRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isProgrammatic = useRef(false);

  const getStickyOffset = useCallback(() => {
    const nav = shellRef.current;
    if (!nav) return 0;

    const rect = nav.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect.bottom : 0;
  }, []);

  const getVisibleSection = useCallback((id: string) => {
    const candidates = document.querySelectorAll<HTMLElement>(`#${CSS.escape(id)}`);
    return Array.from(candidates).find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }, []);

  // Center the active button in the scrollable nav strip
  useEffect(() => {
    const btn = itemRefs.current.get(activeId);
    const nav = navRef.current;
    if (!btn || !nav) return;
    const target = btn.offsetLeft - (nav.offsetWidth - btn.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId]);

  // Scroll-based scrollspy — picks the last section whose top is at/above the nav
  useEffect(() => {
    if (sections.length === 0) return;

    const sync = () => {
      if (isProgrammatic.current) return;
      const threshold = getStickyOffset() + 20;
      let current = sections[0]?.id ?? "";
      for (const { id } of sections) {
        const el = getVisibleSection(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sections, getStickyOffset, getVisibleSection]);

  const handleClick = (id: string) => {
    const el = getVisibleSection(id);
    if (!el) return;
    setActiveId(id);
    isProgrammatic.current = true;

    const top = window.scrollY + el.getBoundingClientRect().top - getStickyOffset();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
    setTimeout(() => { isProgrammatic.current = false; }, 1100);
  };

  if (sections.length < 2) return null;

  return (
    <nav
      ref={shellRef}
      aria-label="Sayfa bölümleri"
      className={cn(
        "sticky top-14 z-30 border-b bg-background/95 backdrop-blur-sm md:top-20",
        "supports-[backdrop-filter]:bg-background/90",
        className,
      )}
    >
      <div
        ref={navRef}
        className={cn(
          "mx-auto flex max-w-[1440px] overflow-x-auto",
          "px-5 sm:px-6 lg:px-10 xl:px-12",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {sections.map(({ id, label }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              type="button"
              onClick={() => handleClick(id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                // Layout
                "relative mr-5 shrink-0 whitespace-nowrap py-3.5 last:mr-0",
                // Typography
                "text-sm font-medium",
                // Animated underline indicator
                "after:absolute after:inset-x-0 after:bottom-0 after:h-[2px]",
                "after:origin-left after:rounded-full after:bg-primary",
                "after:transition-transform after:duration-200 after:ease-out",
                active
                  ? "text-foreground after:scale-x-100"
                  : "text-muted-foreground after:scale-x-0 hover:text-foreground/80",
                "transition-colors duration-150",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
