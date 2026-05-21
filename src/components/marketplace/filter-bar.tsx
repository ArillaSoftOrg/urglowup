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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/category-labels";

interface FilterBarProps {
  categories?: Array<{ name: string; slug: string }>;
  cities?: Array<{ city: string }>;
  districts?: string[];
  showCategory?: boolean;
  showCity?: boolean;
  showDistrict?: boolean;
}

function FilterControls({
  categories,
  cities,
  districts,
  showCategory,
  showCity,
  showDistrict,
  currentCategory,
  currentCity,
  currentDistrict,
  currentMinRating,
  currentHasMedia,
  currentHasHours,
  navigate,
  fullWidth = false,
}: {
  categories?: Array<{ name: string; slug: string }>;
  cities?: Array<{ city: string }>;
  districts?: string[];
  showCategory: boolean;
  showCity: boolean;
  showDistrict: boolean;
  currentCategory: string;
  currentCity: string;
  currentDistrict: string;
  currentMinRating: string;
  currentHasMedia: boolean;
  currentHasHours: boolean;
  navigate: (updates: Record<string, string | undefined>) => void;
  fullWidth?: boolean;
}) {
  return (
    <>
      {showCategory && categories && categories.length > 0 && (
        <Select
          value={currentCategory || "_all"}
          onValueChange={(v) => navigate({ category: v && v !== "_all" ? v : undefined })}
        >
          <SelectTrigger className={cn("h-9", fullWidth ? "w-full" : "w-[180px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tüm kategoriler</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {getCategoryLabel(c.slug, c.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showCity && cities && cities.length > 0 && (
        <Select
          value={currentCity || "_all"}
          onValueChange={(v) => navigate({ city: v && v !== "_all" ? v : undefined })}
        >
          <SelectTrigger className={cn("h-9", fullWidth ? "w-full" : "w-[160px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tüm şehirler</SelectItem>
            {cities.map(({ city }) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showDistrict && districts && districts.length > 0 && (
        <Select
          value={currentDistrict || "_all"}
          onValueChange={(v) => navigate({ district: v && v !== "_all" ? v : undefined })}
        >
          <SelectTrigger className={cn("h-9", fullWidth ? "w-full" : "w-[160px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tüm ilçeler</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={currentMinRating || "_all"}
        onValueChange={(v) => navigate({ minRating: v && v !== "_all" ? v : undefined })}
      >
        <SelectTrigger className={cn("h-9", fullWidth ? "w-full" : "w-[150px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Tüm puanlar</SelectItem>
          <SelectItem value="3">3+ yıldız</SelectItem>
          <SelectItem value="4">4+ yıldız</SelectItem>
          <SelectItem value="4.5">4.5+ yıldız</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={currentHasMedia ? "brand" : "outline"}
        size="sm"
        className={cn("h-9", fullWidth && "w-full")}
        onClick={() => navigate({ hasMedia: currentHasMedia ? undefined : "true" })}
      >
        Portföyü olanlar
      </Button>

      <Button
        variant={currentHasHours ? "brand" : "outline"}
        size="sm"
        className={cn("h-9", fullWidth && "w-full")}
        onClick={() => navigate({ hasHours: currentHasHours ? undefined : "true" })}
      >
        Çalışma saati olanlar
      </Button>
    </>
  );
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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
    ...(currentCategory  ? [{ key: "category",   label: (() => { const c = categories?.find((c) => c.slug === currentCategory); return c ? getCategoryLabel(c.slug, c.name) : currentCategory; })() }] : []),
    ...(currentCity      ? [{ key: "city",        label: currentCity }] : []),
    ...(currentDistrict  ? [{ key: "district",    label: currentDistrict }] : []),
    ...(currentMinRating ? [{ key: "minRating",   label: `${currentMinRating}+ yıldız` }] : []),
    ...(currentHasMedia  ? [{ key: "hasMedia",    label: "Portföyü olanlar" }] : []),
    ...(currentHasHours  ? [{ key: "hasHours",    label: "Çalışma saati olanlar" }] : []),
  ];

  const hasActiveFilters = chips.length > 0;
  const advancedFilterCount = chips.filter((c) => c.key !== "q").length;

  const filterControlsProps = {
    categories,
    cities,
    districts,
    showCategory,
    showCity,
    showDistrict,
    currentCategory,
    currentCity,
    currentDistrict,
    currentMinRating,
    currentHasMedia,
    currentHasHours,
    navigate,
  };

  return (
    <div className="space-y-3">
      {/* Mobile: search + "Filtreler" button */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Input
            type="search"
            placeholder="Uzman ara..."
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
            aria-label="Ara"
          >
            <Search className="size-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5"
          onClick={() => setFilterSheetOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          Filtreler
          {advancedFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-white">
              {advancedFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop: 2-row filter layout */}
      <div className="hidden flex-col gap-3 md:flex">
        <div className="flex items-center gap-1.5">
          <Input
            type="search"
            placeholder="Uzman ara..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-9 flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSearchSubmit}
            aria-label="Ara"
          >
            <Search className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterControls {...filterControlsProps} />
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh]">
          <SheetHeader>
            <SheetTitle>Filtreler</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
            <FilterControls {...filterControlsProps} fullWidth />
          </div>
          <SheetFooter>
            <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
              Uygula
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge
              key={chip.key}
              variant="pink"
              className="flex items-center gap-1 pr-1"
            >
              {chip.label}
              <button
                onClick={() => navigate({ [chip.key]: undefined })}
                className="ml-0.5 rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2"
                aria-label={`${chip.label} filtresini kaldır`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Link
            href={buildClearAllHref()}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Tümünü temizle
          </Link>
        </div>
      )}
    </div>
  );
}
