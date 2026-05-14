"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import Link from "next/link";

interface FilterBarProps {
  categories?: Array<{ name: string; slug: string }>;
  cities?: Array<{ city: string }>;
  districts?: string[];
  showCategory?: boolean;
  showCity?: boolean;
  showDistrict?: boolean;
}

export function FilterBar({
  categories,
  cities,
  districts,
  showCategory = false,
  showCity = false,
  showDistrict = false,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive current values from URL (source of truth)
  const currentQ         = searchParams.get("q") ?? "";
  const currentCategory  = searchParams.get("category") ?? "";
  const currentCity      = searchParams.get("city") ?? "";
  const currentDistrict  = searchParams.get("district") ?? "";
  const currentMinRating = searchParams.get("minRating") ?? "";
  const currentHasMedia  = searchParams.get("hasMedia") === "true";
  const currentHasHours  = searchParams.get("hasHours") === "true";

  // Local state only for text input — navigates on Enter/click, not every keystroke
  const [inputValue, setInputValue] = useState(currentQ);

  // Keep input in sync when URL changes externally (browser back/forward)
  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleSearchSubmit() {
    navigate({ q: inputValue.trim() || undefined });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearchSubmit();
  }

  function buildClearAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    ["q", "category", "city", "district", "minRating", "hasMedia", "hasHours"].forEach(
      (k) => params.delete(k)
    );
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Active filter chips
  type Chip = { key: string; label: string };
  const chips: Chip[] = [
    ...(currentQ         ? [{ key: "q",         label: `"${currentQ}"` }] : []),
    ...(currentCategory  ? [{ key: "category",   label: categories?.find((c) => c.slug === currentCategory)?.name ?? currentCategory }] : []),
    ...(currentCity      ? [{ key: "city",        label: currentCity }] : []),
    ...(currentDistrict  ? [{ key: "district",    label: currentDistrict }] : []),
    ...(currentMinRating ? [{ key: "minRating",   label: `${currentMinRating}+ stars` }] : []),
    ...(currentHasMedia  ? [{ key: "hasMedia",    label: "Has portfolio" }] : []),
    ...(currentHasHours  ? [{ key: "hasHours",    label: "Has hours" }] : []),
  ];

  const hasActiveFilters = chips.length > 0;

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex min-w-[180px] flex-1 items-center gap-1.5">
          <Input
            type="search"
            placeholder="Search professionals..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-9"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSearchSubmit}
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
        </div>

        {/* Category */}
        {showCategory && categories && categories.length > 0 && (
          <Select
            value={currentCategory || "_all"}
            onValueChange={(v) => navigate({ category: v && v !== "_all" ? v : undefined })}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* City */}
        {showCity && cities && cities.length > 0 && (
          <Select
            value={currentCity || "_all"}
            onValueChange={(v) => navigate({ city: v && v !== "_all" ? v : undefined })}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All cities</SelectItem>
              {cities.map(({ city }) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* District */}
        {showDistrict && districts && districts.length > 0 && (
          <Select
            value={currentDistrict || "_all"}
            onValueChange={(v) => navigate({ district: v && v !== "_all" ? v : undefined })}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Min rating */}
        <Select
          value={currentMinRating || "_all"}
          onValueChange={(v) => navigate({ minRating: v && v !== "_all" ? v : undefined })}
        >
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Any rating</SelectItem>
            <SelectItem value="3">3+ stars</SelectItem>
            <SelectItem value="4">4+ stars</SelectItem>
            <SelectItem value="4.5">4.5+ stars</SelectItem>
          </SelectContent>
        </Select>

        {/* Has portfolio */}
        <Button
          variant={currentHasMedia ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => navigate({ hasMedia: currentHasMedia ? undefined : "true" })}
        >
          Has portfolio
        </Button>

        {/* Has hours */}
        <Button
          variant={currentHasHours ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => navigate({ hasHours: currentHasHours ? undefined : "true" })}
        >
          Has hours
        </Button>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {chip.label}
              <button
                onClick={() => navigate({ [chip.key]: undefined })}
                className="ml-0.5 rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Link
            href={buildClearAllHref()}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}
