"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Search, Tags } from "lucide-react";
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
    <div className="mx-auto mt-8 w-full max-w-[23rem] rounded-[1.75rem] border border-brand-purple/40 bg-background p-3 shadow-lg md:mt-10 md:max-w-[31rem] md:p-4">
      <div className="grid gap-3">
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-input bg-background px-4 transition-colors hover:border-foreground/20 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 md:min-h-14">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={labels.searchPlaceholder}
            className="h-10 w-full min-w-0 border-0 bg-transparent px-0 text-base outline-none placeholder:text-muted-foreground"
          />
        </label>

        <label className="relative flex min-h-12 items-center gap-3 rounded-xl border border-input bg-background px-4 transition-colors hover:border-foreground/20 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 md:min-h-14">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <select
            value={city}
            onChange={(event) =>
              setCity(event.target.value && event.target.value !== "_all" ? event.target.value : "")
            }
            className="h-10 w-full appearance-none border-0 bg-transparent px-0 pr-8 text-base outline-none"
          >
            <option value="_all">{labels.regionPlaceholder}</option>
            {cities.map(({ city }) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </label>

        <label className="relative flex min-h-12 items-center gap-3 rounded-xl border border-input bg-background px-4 transition-colors hover:border-foreground/20 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 md:min-h-14">
          <Tags className="size-5 shrink-0 text-muted-foreground" />
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value && event.target.value !== "_all" ? event.target.value : "",
              )
            }
            className="h-10 w-full appearance-none border-0 bg-transparent px-0 pr-8 text-base outline-none"
          >
            <option value="_all">{labels.categoryPlaceholder}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {getCategoryLabel(category.slug, category.name)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </label>

        <button
          type="button"
          onClick={submitSearch}
          className="inline-flex min-h-12 items-center justify-center rounded-3xl bg-brand-pink px-8 text-base font-semibold text-brand-pink-foreground shadow-sm transition-colors hover:bg-surface-pink-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-pink/30 md:min-h-14"
        >
          {labels.submit}
        </button>
      </div>
    </div>
  );
}
