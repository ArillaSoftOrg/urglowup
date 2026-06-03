"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { getCategoryLabel } from "@/lib/category-labels";

interface HomeSearchPanelProps {
  categories: Array<{ name: string; slug: string }>;
  cities: Array<{ city: string }>;
  exploreHref: string;
  labels: {
    searchPlaceholder: string;
    regionPlaceholder: string;
    categoryPlaceholder: string;
    submit: string;
  };
}

export function HomeSearchPanel({
  categories,
  cities,
  exploreHref,
  labels,
}: HomeSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  function submitSearch() {
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();

    if (trimmedQuery) params.set("q", trimmedQuery);
    if (city) params.set("city", city);
    if (category) params.set("category", category);

    const qs = params.toString();
    router.push(qs ? `${exploreHref}?${qs}` : exploreHref);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") submitSearch();
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-5xl rounded-[2rem] border border-border/70 bg-background p-2 shadow-[0_18px_60px_oklch(0.145_0_0/0.08)] md:mt-10">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1.5fr)_minmax(11rem,0.7fr)_minmax(11rem,0.7fr)_auto] md:items-center">
        <div className="flex h-12 items-center gap-3 rounded-3xl px-3 md:h-14 md:border-r md:border-border/70 md:rounded-none">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={labels.searchPlaceholder}
            className="h-10 w-full min-w-0 border-0 bg-transparent px-0 text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="relative">
          <select
            value={city}
            onChange={(event) =>
              setCity(event.target.value && event.target.value !== "_all" ? event.target.value : "")
            }
            className="h-12 w-full appearance-none rounded-3xl border border-border/70 bg-background px-4 pr-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-14 md:border-0 md:border-r md:rounded-none md:border-border/70"
          >
            <option value="_all">{labels.regionPlaceholder}</option>
            {cities.map(({ city }) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value && event.target.value !== "_all" ? event.target.value : "",
              )
            }
            className="h-12 w-full appearance-none rounded-3xl border border-border/70 bg-background px-4 pr-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-14 md:border-0 md:rounded-none"
          >
            <option value="_all">{labels.categoryPlaceholder}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {getCategoryLabel(category.slug, category.name)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          type="button"
          onClick={submitSearch}
          className="inline-flex h-12 items-center justify-center rounded-3xl border border-brand-pink/20 bg-brand-pink px-8 text-base font-semibold text-brand-pink-foreground transition-colors hover:bg-surface-pink-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-pink/30 md:h-14"
        >
          {labels.submit}
        </button>
      </div>
    </div>
  );
}
