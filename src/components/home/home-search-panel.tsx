"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={labels.searchPlaceholder}
            className="h-10 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
        </div>

        <Select
          value={city}
          onValueChange={(value) => setCity(value && value !== "_all" ? value : "")}
        >
          <SelectTrigger className="h-12 rounded-3xl border-border/70 bg-background px-4 md:h-14 md:border-0 md:border-r md:rounded-none md:border-border/70">
            <SelectValue placeholder={labels.regionPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{labels.regionPlaceholder}</SelectItem>
            {cities.map(({ city }) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(value) => setCategory(value && value !== "_all" ? value : "")}
        >
          <SelectTrigger className="h-12 rounded-3xl border-border/70 bg-background px-4 md:h-14 md:border-0 md:rounded-none">
            <SelectValue placeholder={labels.categoryPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{labels.categoryPlaceholder}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {getCategoryLabel(category.slug, category.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="lg"
          onClick={submitSearch}
          className="h-12 rounded-3xl px-8 text-base font-semibold md:h-14"
        >
          {labels.submit}
        </Button>
      </div>
    </div>
  );
}
