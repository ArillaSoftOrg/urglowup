"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExploreViewToggle({
  activeView,
  listLabel,
  mapLabel,
}: {
  activeView: "list" | "map";
  listLabel: string;
  mapLabel: string;
}) {
  const pathname = usePathname() ?? "/explore";
  const searchParams = useSearchParams();

  function hrefFor(view: "list" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") params.delete("view");
    else params.set("view", "map");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <nav
      aria-label={`${listLabel} / ${mapLabel}`}
      className="inline-flex rounded-xl border border-border/70 bg-muted/60 p-1"
    >
      <Link
        href={hrefFor("list")}
        aria-current={activeView === "list" ? "page" : undefined}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          activeView === "list"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
        {listLabel}
      </Link>
      <Link
        href={hrefFor("map")}
        aria-current={activeView === "map" ? "page" : undefined}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          activeView === "map"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <MapIcon className="size-4" />
        {mapLabel}
      </Link>
    </nav>
  );
}
