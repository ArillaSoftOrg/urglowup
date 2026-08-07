"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MarketplaceSort } from "@/lib/marketplace/ranking";

const SORT_COPY: Record<
  string,
  {
    label: string;
    recommended: string;
    rating: string;
    reviewCount: string;
    newest: string;
  }
> = {
  tr: {
    label: "Sıralama",
    recommended: "En uygun",
    rating: "En yüksek puan",
    reviewCount: "En çok yorumlanan",
    newest: "Yeni katılanlar",
  },
  en: {
    label: "Sort",
    recommended: "Best match",
    rating: "Highest rated",
    reviewCount: "Most reviewed",
    newest: "Newest",
  },
  de: {
    label: "Sortierung",
    recommended: "Beste Treffer",
    rating: "Beste Bewertung",
    reviewCount: "Meiste Bewertungen",
    newest: "Neu dabei",
  },
};

export function MarketplaceSortSelect({
  value,
  locale,
}: {
  value: MarketplaceSort;
  locale?: string;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const copy = SORT_COPY[locale ?? "tr"] ?? SORT_COPY.en;

  function updateSort(sort: MarketplaceSort) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (sort === "recommended") params.delete("sort");
    else params.set("sort", sort);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{copy.label}</span>
      <select
        value={value}
        onChange={(event) =>
          updateSort(event.target.value as MarketplaceSort)
        }
        className="h-10 max-w-[11rem] appearance-none rounded-lg border border-input bg-background py-0 pl-3 pr-9 text-sm font-medium outline-none transition-colors hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-none"
      >
        <option value="recommended">{copy.recommended}</option>
        <option value="rating">{copy.rating}</option>
        <option value="reviewCount">{copy.reviewCount}</option>
        <option value="newest">{copy.newest}</option>
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </label>
  );
}
