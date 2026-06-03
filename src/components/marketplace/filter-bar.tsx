"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCategoryLabel } from "@/lib/category-labels";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

interface FilterBarProps {
  categories?: Array<{ name: string; slug: string }>;
  cities?: Array<{ city: string }>;
  districts?: string[];
  showCategory?: boolean;
  showCity?: boolean;
  showDistrict?: boolean;
}

function NativeSelect({
  value,
  placeholder,
  options,
  onChange,
  className,
}: {
  value: string;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value || "_all"}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="_all">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function ToggleButton({
  active,
  fullWidth = false,
  children,
  onClick,
}: {
  active: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        fullWidth && "w-full",
        active
          ? "bg-brand text-white hover:bg-brand/90"
          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
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
        <NativeSelect
          value={currentCategory}
          placeholder="Tüm kategoriler"
          options={categories.map((category) => ({
            label: getCategoryLabel(category.slug, category.name),
            value: category.slug,
          }))}
          onChange={(value) => navigate({ category: value === "_all" ? undefined : value })}
          className={fullWidth ? "w-full" : "w-[180px]"}
        />
      )}

      {showCity && cities && cities.length > 0 && (
        <NativeSelect
          value={currentCity}
          placeholder="Tüm şehirler"
          options={cities.map(({ city }) => ({ label: city, value: city }))}
          onChange={(value) => navigate({ city: value === "_all" ? undefined : value })}
          className={fullWidth ? "w-full" : "w-[160px]"}
        />
      )}

      {showDistrict && districts && districts.length > 0 && (
        <NativeSelect
          value={currentDistrict}
          placeholder="Tüm ilçeler"
          options={districts.map((district) => ({ label: district, value: district }))}
          onChange={(value) => navigate({ district: value === "_all" ? undefined : value })}
          className={fullWidth ? "w-full" : "w-[160px]"}
        />
      )}

      <NativeSelect
        value={currentMinRating}
        placeholder="Tüm puanlar"
        options={[
          { label: "3+ yıldız", value: "3" },
          { label: "4+ yıldız", value: "4" },
          { label: "4.5+ yıldız", value: "4.5" },
        ]}
        onChange={(value) => navigate({ minRating: value === "_all" ? undefined : value })}
        className={fullWidth ? "w-full" : "w-[150px]"}
      />

      <ToggleButton
        active={currentHasMedia}
        fullWidth={fullWidth}
        onClick={() => navigate({ hasMedia: currentHasMedia ? undefined : "true" })}
      >
        Portföyü olanlar
      </ToggleButton>

      <ToggleButton
        active={currentHasHours}
        fullWidth={fullWidth}
        onClick={() => navigate({ hasHours: currentHasHours ? undefined : "true" })}
      >
        Çalışma saati olanlar
      </ToggleButton>
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
  const pathname = usePathname() ?? "";
  const rawSearchParams = useSearchParams();
  const searchParams = useMemo(
    () => rawSearchParams ?? new URLSearchParams(),
    [rawSearchParams]
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const currentQ = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentCity = searchParams.get("city") ?? "";
  const currentDistrict = searchParams.get("district") ?? "";
  const currentMinRating = searchParams.get("minRating") ?? "";
  const currentHasMedia = searchParams.get("hasMedia") === "true";
  const currentHasHours = searchParams.get("hasHours") === "true";

  const [inputValue, setInputValue] = useState(currentQ);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL->state sync for back/forward navigation
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

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleSearchSubmit();
  }

  function buildClearAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    ["q", "category", "city", "district", "minRating", "hasMedia", "hasHours"].forEach((key) =>
      params.delete(key)
    );
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  type Chip = { key: string; label: string };
  const chips: Chip[] = [
    ...(currentQ ? [{ key: "q", label: `"${currentQ}"` }] : []),
    ...(currentCategory
      ? [
          {
            key: "category",
            label:
              categories?.find((category) => category.slug === currentCategory)
                ? getCategoryLabel(
                    categories.find((category) => category.slug === currentCategory)!.slug,
                    categories.find((category) => category.slug === currentCategory)!.name
                  )
                : currentCategory,
          },
        ]
      : []),
    ...(currentCity ? [{ key: "city", label: currentCity }] : []),
    ...(currentDistrict ? [{ key: "district", label: currentDistrict }] : []),
    ...(currentMinRating ? [{ key: "minRating", label: `${currentMinRating}+ yıldız` }] : []),
    ...(currentHasMedia ? [{ key: "hasMedia", label: "Portföyü olanlar" }] : []),
    ...(currentHasHours ? [{ key: "hasHours", label: "Çalışma saati olanlar" }] : []),
  ];

  const hasActiveFilters = chips.length > 0;
  const advancedFilterCount = chips.filter((chip) => chip.key !== "q").length;

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
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <input
              type="search"
              placeholder="Uzman ara..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-9 w-full rounded-md border border-input bg-background pl-3 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={handleSearchSubmit}
            aria-label="Ara"
          >
            <Search className="size-4" />
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => setFilterSheetOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          Filtreler
          {advancedFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-white">
              {advancedFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="hidden flex-col gap-3 md:flex">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Uzman ara..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-9 w-full rounded-md border border-input bg-background pl-3 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={handleSearchSubmit}
            aria-label="Ara"
          >
            <Search className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterControls {...filterControlsProps} />
        </div>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh]">
          <SheetHeader>
            <SheetTitle>Filtreler</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
            <FilterControls {...filterControlsProps} fullWidth />
          </div>
          <SheetFooter>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => setFilterSheetOpen(false)}
            >
              Uygula
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="pink" className="flex items-center gap-1 pr-1">
              {chip.label}
              <button
                type="button"
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
