"use client";

import { useState, useEffect } from "react";
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
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/category-labels";

interface SearchPanelProps {
  categories?: Array<{ name: string; slug: string }>;
  cities?: Array<{ city: string }>;
}

export function SearchPanel({ categories, cities }: SearchPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const currentQ         = searchParams.get("q") ?? "";
  const currentCategory  = searchParams.get("category") ?? "";
  const currentCity      = searchParams.get("city") ?? "";
  const currentDistrict  = searchParams.get("district") ?? "";
  const currentMinRating = searchParams.get("minRating") ?? "";
  const currentHasMedia  = searchParams.get("hasMedia") === "true";
  const currentHasHours  = searchParams.get("hasHours") === "true";

  const [inputValue, setInputValue] = useState(currentQ);

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

  function buildClearAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    ["q", "category", "city", "district", "minRating", "hasMedia", "hasHours"].forEach(
      (k) => params.delete(k)
    );
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="space-y-3">
      {/* Mobile layout */}
      <div className="flex flex-col gap-2 md:hidden">
        <Input
          type="search"
          placeholder="Uzman, hizmet veya işletme ara"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="h-9"
        />
        {cities && cities.length > 0 && (
          <Select
            value={currentCity || "_all"}
            onValueChange={(v) => navigate({ city: v && v !== "_all" ? v : undefined })}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Bölge veya ilçe seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Bölge veya ilçe seç</SelectItem>
              {cities.map(({ city }) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5"
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
          <Button
            size="sm"
            className="h-9 flex-1"
            onClick={handleSearchSubmit}
          >
            Ara
          </Button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden items-center gap-2 md:flex">
        <Input
          type="search"
          placeholder="Uzman, hizmet veya işletme ara"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="h-9 flex-1"
        />
        {cities && cities.length > 0 && (
          <Select
            value={currentCity || "_all"}
            onValueChange={(v) => navigate({ city: v && v !== "_all" ? v : undefined })}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Bölge veya ilçe seç</SelectItem>
              {cities.map(({ city }) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {categories && categories.length > 0 && (
          <Select
            value={currentCategory || "_all"}
            onValueChange={(v) => navigate({ category: v && v !== "_all" ? v : undefined })}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Kategori seç</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {getCategoryLabel(c.slug, c.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
        <Button
          size="sm"
          className="h-9 shrink-0"
          onClick={handleSearchSubmit}
        >
          Ara
        </Button>
      </div>

      {/* Advanced filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh]">
          <SheetHeader>
            <SheetTitle>Gelişmiş Filtreler</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
            {/* Category select on mobile only */}
            {categories && categories.length > 0 && (
              <div className="md:hidden">
                <Select
                  value={currentCategory || "_all"}
                  onValueChange={(v) => navigate({ category: v && v !== "_all" ? v : undefined })}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Kategori seç</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {getCategoryLabel(c.slug, c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Advanced filters - all viewports */}
            <Select
              value={currentMinRating || "_all"}
              onValueChange={(v) => navigate({ minRating: v && v !== "_all" ? v : undefined })}
            >
              <SelectTrigger className="h-9 w-full">
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
              className="h-9 w-full"
              onClick={() => navigate({ hasMedia: currentHasMedia ? undefined : "true" })}
            >
              Portföyü olanlar
            </Button>
            <Button
              variant={currentHasHours ? "brand" : "outline"}
              size="sm"
              className="h-9 w-full"
              onClick={() => navigate({ hasHours: currentHasHours ? undefined : "true" })}
            >
              Çalışma saati olanlar
            </Button>
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
