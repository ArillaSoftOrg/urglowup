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
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

const AVAILABILITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "today", label: "Bugün açık" },
  { value: "tomorrow", label: "Yarın açık" },
  { value: "weekend", label: "Hafta sonu açık" },
  { value: "evening", label: "Akşam açık" },
];

const AVAILABILITY_LABELS: Record<string, string> = Object.fromEntries(
  AVAILABILITY_OPTIONS.map((option) => [option.value, option.label])
);

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
        className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm outline-none transition-colors hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:rounded-md"
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
  description,
  children,
  onClick,
}: {
  active: boolean;
  fullWidth?: boolean;
  description?: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-md text-sm font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        fullWidth
          ? "min-h-14 w-full justify-between rounded-xl border px-3.5 py-2 text-left"
          : "h-9 justify-center px-4",
        active
          ? fullWidth
            ? "border-foreground/20 bg-foreground text-background"
            : "bg-brand-pink text-brand-pink-foreground hover:bg-surface-pink-hover"
          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onClick}
    >
      <span className={cn("flex flex-col", !fullWidth && "items-center")}>
        <span>{children}</span>
        {description && fullWidth && (
          <span
            className={cn(
              "mt-0.5 text-xs font-normal",
              active ? "text-background/70" : "text-muted-foreground"
            )}
          >
            {description}
          </span>
        )}
      </span>
      {fullWidth && active && <Check className="size-4 shrink-0" />}
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
  currentAvailability,
  currentPriceMin,
  currentPriceMax,
  currentMaxDuration,
  currentMinReviewCount,
  onPriceMinChange,
  onPriceMaxChange,
  onPriceCommit,
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
  currentAvailability: string;
  currentPriceMin: string;
  currentPriceMax: string;
  currentMaxDuration: string;
  currentMinReviewCount: string;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onPriceCommit: () => void;
  navigate: (updates: Record<string, string | undefined>) => void;
  fullWidth?: boolean;
}) {
  function handlePriceKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") onPriceCommit();
  }

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
        value={currentAvailability}
        placeholder="Müsaitlik"
        options={AVAILABILITY_OPTIONS}
        onChange={(value) => navigate({ availability: value === "_all" ? undefined : value })}
        className={fullWidth ? "w-full" : "w-[150px]"}
      />

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

      <NativeSelect
        value={currentMinReviewCount}
        placeholder="Tüm değerlendirme sayıları"
        options={[
          { label: "10+ değerlendirme", value: "10" },
          { label: "50+ değerlendirme", value: "50" },
          { label: "100+ değerlendirme", value: "100" },
        ]}
        onChange={(value) => navigate({ minReviewCount: value === "_all" ? undefined : value })}
        className={fullWidth ? "w-full" : "w-[170px]"}
      />

      <NativeSelect
        value={currentMaxDuration}
        placeholder="Hizmet süresi"
        options={[
          { label: "30 dakikaya kadar", value: "30" },
          { label: "60 dakikaya kadar", value: "60" },
          { label: "90 dakikaya kadar", value: "90" },
          { label: "120 dakikaya kadar", value: "120" },
        ]}
        onChange={(value) => navigate({ maxDuration: value === "_all" ? undefined : value })}
        className={fullWidth ? "w-full" : "w-[170px]"}
      />

      <div className={cn("flex items-center gap-1.5", fullWidth ? "w-full" : "")}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Min ₺"
          value={currentPriceMin}
          onChange={(event) => onPriceMinChange(event.target.value)}
          onBlur={onPriceCommit}
          onKeyDown={handlePriceKeyDown}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            fullWidth ? "w-full" : "w-[90px]"
          )}
        />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Maks ₺"
          value={currentPriceMax}
          onChange={(event) => onPriceMaxChange(event.target.value)}
          onBlur={onPriceCommit}
          onKeyDown={handlePriceKeyDown}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            fullWidth ? "w-full" : "w-[90px]"
          )}
        />
      </div>

      <ToggleButton
        active={currentHasMedia}
        fullWidth={fullWidth}
        description="Fotoğraf ve çalışma örnekleri olan işletmeler"
        onClick={() => navigate({ hasMedia: currentHasMedia ? undefined : "true" })}
      >
        Portföyü olanlar
      </ToggleButton>

      <ToggleButton
        active={currentHasHours}
        fullWidth={fullWidth}
        description="Profilinde açık saat bilgisi bulunanlar"
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
  const currentAvailability = searchParams.get("availability") ?? "";
  const currentMaxDuration = searchParams.get("maxDuration") ?? "";
  const currentMinReviewCount = searchParams.get("minReviewCount") ?? "";

  const [inputValue, setInputValue] = useState(currentQ);
  const [priceMinInput, setPriceMinInput] = useState(searchParams.get("priceMin") ?? "");
  const [priceMaxInput, setPriceMaxInput] = useState(searchParams.get("priceMax") ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL->state sync for back/forward navigation
    setInputValue(searchParams.get("q") ?? "");
    setPriceMinInput(searchParams.get("priceMin") ?? "");
    setPriceMaxInput(searchParams.get("priceMax") ?? "");
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

  function commitPriceRange() {
    navigate({
      priceMin: priceMinInput.trim() || undefined,
      priceMax: priceMaxInput.trim() || undefined,
    });
  }

  const FILTER_KEYS = [
    "q", "category", "city", "district", "minRating", "hasMedia", "hasHours",
    "availability", "priceMin", "priceMax", "maxDuration", "minReviewCount",
  ];

  function buildClearAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((key) => params.delete(key));
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
    ...(currentAvailability
      ? [{ key: "availability", label: AVAILABILITY_LABELS[currentAvailability] ?? currentAvailability }]
      : []),
    ...(priceMinInput ? [{ key: "priceMin", label: `₺${priceMinInput}+` }] : []),
    ...(priceMaxInput ? [{ key: "priceMax", label: `₺${priceMaxInput} ve altı` }] : []),
    ...(currentMaxDuration ? [{ key: "maxDuration", label: `≤${currentMaxDuration} dk` }] : []),
    ...(currentMinReviewCount
      ? [{ key: "minReviewCount", label: `${currentMinReviewCount}+ değerlendirme` }]
      : []),
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
    currentAvailability,
    currentPriceMin: priceMinInput,
    currentPriceMax: priceMaxInput,
    currentMaxDuration,
    currentMinReviewCount,
    onPriceMinChange: setPriceMinInput,
    onPriceMaxChange: setPriceMaxInput,
    onPriceCommit: commitPriceRange,
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
            <span className="flex size-4 items-center justify-center rounded-full bg-brand-pink text-[10px] font-medium text-brand-pink-foreground">
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
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[82dvh] w-[min(100vw,34rem)] gap-0 rounded-t-2xl border-x border-t border-border/80 p-0 shadow-2xl sm:bottom-4 sm:rounded-2xl"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/25" />
          <SheetHeader className="border-b border-border/70 px-4 pb-3 pt-4">
            <SheetTitle className="text-base font-semibold">Filtreler</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtre seçenekleri
              </p>
              <div className="grid gap-2">
                <FilterControls {...filterControlsProps} fullWidth />
              </div>
            </div>
          </div>
          <SheetFooter className="border-t border-border/70 bg-background/95 p-4">
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
