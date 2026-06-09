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

const AVAILABILITY_OPTIONS: Array<{ value: string; label: string; description: string }> = [
  { value: "today", label: "Bugün", description: "Bugün açık olabilir" },
  { value: "tomorrow", label: "Yarın", description: "Yarın açık olabilir" },
  { value: "weekend", label: "Hafta sonu", description: "Cumartesi/Pazar açık olabilir" },
  { value: "evening", label: "Akşam", description: "Saat 18:00'den sonra açık" },
];

const AVAILABILITY_LABELS: Record<string, string> = Object.fromEntries(
  AVAILABILITY_OPTIONS.map((option) => [option.value, option.label])
);

interface SearchPanelProps {
  categories?: Array<{ name: string; slug: string }>;
  cities?: Array<{ city: string }>;
  categoryPathPrefix?: string;
  allCategoriesHref?: string;
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
  className,
  description,
  children,
  onClick,
}: {
  active: boolean;
  className?: string;
  description?: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-brand text-white hover:bg-brand/90"
          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={onClick}
    >
      <span className={cn("flex flex-col", className?.includes("w-full") && "items-start text-left")}>
        <span>{children}</span>
        {description && (
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
      {className?.includes("w-full") && active && <Check className="ml-auto size-4 shrink-0" />}
    </button>
  );
}

export function SearchPanel({
  categories,
  cities,
  categoryPathPrefix,
  allCategoriesHref,
}: SearchPanelProps) {
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
  const currentPriceMin = searchParams.get("priceMin") ?? "";
  const currentPriceMax = searchParams.get("priceMax") ?? "";
  const currentMaxDuration = searchParams.get("maxDuration") ?? "";
  const currentMinReviewCount = searchParams.get("minReviewCount") ?? "";

  const [inputValue, setInputValue] = useState(currentQ);
  const [priceMinInput, setPriceMinInput] = useState(currentPriceMin);
  const [priceMaxInput, setPriceMaxInput] = useState(currentPriceMax);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL->state sync for back/forward navigation
    setInputValue(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL->state sync for back/forward navigation
    setPriceMinInput(searchParams.get("priceMin") ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL->state sync for back/forward navigation
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

  function handlePriceKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") commitPriceRange();
  }

  function handleCategoryChange(value: string) {
    if (!categoryPathPrefix) {
      navigate({ category: value === "_all" || !value ? undefined : value });
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    const qs = params.toString();

    if (value === "_all" || !value) {
      router.replace(
        qs && allCategoriesHref ? `${allCategoriesHref}?${qs}` : allCategoriesHref ?? pathname,
        { scroll: false }
      );
      return;
    }

    router.replace(`${categoryPathPrefix}/${value}${qs ? `?${qs}` : ""}`, { scroll: false });
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
    ...(currentPriceMin ? [{ key: "priceMin", label: `₺${currentPriceMin}+` }] : []),
    ...(currentPriceMax ? [{ key: "priceMax", label: `₺${currentPriceMax} ve altı` }] : []),
    ...(currentMaxDuration ? [{ key: "maxDuration", label: `≤${currentMaxDuration} dk` }] : []),
    ...(currentMinReviewCount
      ? [{ key: "minReviewCount", label: `${currentMinReviewCount}+ değerlendirme` }]
      : []),
  ];

  const FILTER_KEYS = [
    "q", "category", "city", "district", "minRating", "hasMedia", "hasHours",
    "availability", "priceMin", "priceMax", "maxDuration", "minReviewCount",
  ];

  const hasActiveFilters = chips.length > 0;
  const advancedFilterCount = chips.filter((chip) => chip.key !== "q").length;
  function buildClearAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((key) =>
      params.delete(key)
    );
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Uzman, hizmet veya işletme ara"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {cities && cities.length > 0 && (
          <NativeSelect
            value={currentCity}
            placeholder="Bölge veya ilçe seç"
            options={cities.map(({ city }) => ({ label: city, value: city }))}
            onChange={(value) => navigate({ city: value === "_all" ? undefined : value })}
          />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
          <button
            type="button"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={handleSearchSubmit}
          >
            Ara
          </button>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Uzman, hizmet veya işletme ara"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {cities && cities.length > 0 && (
          <NativeSelect
            value={currentCity}
            placeholder="Bölge veya ilçe seç"
            options={cities.map(({ city }) => ({ label: city, value: city }))}
            onChange={(value) => navigate({ city: value === "_all" ? undefined : value })}
            className="w-[160px]"
          />
        )}

        {categories && categories.length > 0 && (
          <NativeSelect
            value={categoryPathPrefix ? pathname.split("/").filter(Boolean).at(-1) ?? "" : currentCategory}
            placeholder="Kategori seç"
            options={categories.map((category) => ({
              label: getCategoryLabel(category.slug, category.name),
              value: category.slug,
            }))}
            onChange={handleCategoryChange}
            className="w-[180px]"
          />
        )}

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

        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={handleSearchSubmit}
        >
          Ara
        </button>
      </div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[82dvh] w-[min(100vw,34rem)] gap-0 rounded-t-2xl border-x border-t border-border/80 p-0 shadow-2xl sm:bottom-4 sm:rounded-2xl"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/25" />
          <SheetHeader className="border-b border-border/70 px-4 pb-3 pt-4">
            <SheetTitle className="text-base font-semibold">Gelişmiş Filtreler</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Müsaitlik
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    active={currentAvailability === option.value}
                    className="h-auto min-h-14 w-full justify-between rounded-xl border px-3.5 py-2"
                    description={option.description}
                    onClick={() =>
                      navigate({
                        availability: currentAvailability === option.value ? undefined : option.value,
                      })
                    }
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fiyat ve süre
              </p>
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Min ₺"
                    value={priceMinInput}
                    onChange={(event) => setPriceMinInput(event.target.value)}
                    onBlur={commitPriceRange}
                    onKeyDown={handlePriceKeyDown}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:rounded-md"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Maks ₺"
                    value={priceMaxInput}
                    onChange={(event) => setPriceMaxInput(event.target.value)}
                    onBlur={commitPriceRange}
                    onKeyDown={handlePriceKeyDown}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:rounded-md"
                  />
                </div>

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
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Eşleşme
              </p>
              <div className="grid gap-2">
                {categories && categories.length > 0 && (
                  <div className="md:hidden">
                    <NativeSelect
                      value={categoryPathPrefix ? pathname.split("/").filter(Boolean).at(-1) ?? "" : currentCategory}
                      placeholder="Kategori seç"
                      options={categories.map((category) => ({
                        label: getCategoryLabel(category.slug, category.name),
                        value: category.slug,
                      }))}
                      onChange={handleCategoryChange}
                    />
                  </div>
                )}

                <NativeSelect
                  value={currentMinRating}
                  placeholder="Tüm puanlar"
                  options={[
                    { label: "6+ puan", value: "6" },
                    { label: "8+ puan", value: "8" },
                    { label: "9+ puan", value: "9" },
                  ]}
                  onChange={(value) => navigate({ minRating: value === "_all" ? undefined : value })}
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Profil kalitesi
              </p>
              <div className="grid gap-2">
                <ToggleButton
                  active={currentHasMedia}
                  className="h-auto min-h-14 w-full justify-between rounded-xl border px-3.5 py-2"
                  description="Fotoğraf ve çalışma örnekleri olan işletmeler"
                  onClick={() => navigate({ hasMedia: currentHasMedia ? undefined : "true" })}
                >
                  Portföyü olanlar
                </ToggleButton>

                <ToggleButton
                  active={currentHasHours}
                  className="h-auto min-h-14 w-full justify-between rounded-xl border px-3.5 py-2"
                  description="Profilinde açık saat bilgisi bulunanlar"
                  onClick={() => navigate({ hasHours: currentHasHours ? undefined : "true" })}
                >
                  Çalışma saati olanlar
                </ToggleButton>
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
