"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay, startOfDay } from "date-fns";
import { enUS, tr } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  Grid2X2,
  MapPin,
  Search,
  Scissors,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCategoryLabel } from "@/lib/category-labels";
import { cn } from "@/lib/utils";

type SearchPanel = "service" | "location" | "date" | null;
type SuggestionTab = "all" | "services" | "businesses";

type SearchBusiness = {
  name: string;
  slug: string;
  city: string | null;
  district: string | null;
  categoryName?: string | null;
};

interface HomeSearchPanelProps {
  categories: Array<{ name: string; slug: string }>;
  cities: Array<{ city: string; count?: number }>;
  businesses?: SearchBusiness[];
  exploreHref: string;
  locale?: string;
  /** "compact" trims the pill down for a persistent sticky-header search (desktop only). */
  variant?: "hero" | "compact";
  labels: {
    searchPlaceholder: string;
    regionPlaceholder: string;
    categoryPlaceholder: string;
    datePlaceholder: string;
    submit: string;
  };
}

const TIME_PRESETS = [
  { value: "", label: "Herhangi bir zaman", labelEn: "Any time", detail: "" },
  { value: "morning", label: "Sabah", labelEn: "Morning", detail: "09 - 12" },
  {
    value: "afternoon",
    label: "Öğleden sonra",
    labelEn: "Afternoon",
    detail: "12 - 17",
  },
  { value: "evening", label: "Akşam", labelEn: "Evening", detail: "17 - 00" },
] as const;

const UI_COPY = {
  tr: {
    serviceTitle: "Hizmet veya işletme seç",
    locationTitle: "Bölge seç",
    dateTitle: "Tarih ve saat",
    all: "Tümü",
    services: "Hizmetler",
    businesses: "İşletmeler",
    suggestions: "Önerilenler",
    clear: "Temizle",
    done: "Bitti",
    today: "Bugün",
    tomorrow: "Yarın",
    selectTime: "Saat seçin",
    allRegions: "Tüm bölgeler",
    noResults: "Aramanızla eşleşen sonuç bulunamadı.",
    country: "Türkiye",
  },
  en: {
    serviceTitle: "Choose a service or business",
    locationTitle: "Choose an area",
    dateTitle: "Date and time",
    all: "All",
    services: "Services",
    businesses: "Businesses",
    suggestions: "Suggestions",
    clear: "Clear",
    done: "Done",
    today: "Today",
    tomorrow: "Tomorrow",
    selectTime: "Choose a time",
    allRegions: "All areas",
    noResults: "No results match your search.",
    country: "Türkiye",
  },
};

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function HomeSearchPanel({
  categories,
  cities,
  businesses = [],
  exploreHref,
  locale = "tr",
  variant = "hero",
  labels,
}: HomeSearchPanelProps) {
  const compact = variant === "compact";
  const router = useRouter();
  const isMobile = useIsMobile();
  const [activePanel, setActivePanel] = useState<SearchPanel>(null);
  const [mobilePanel, setMobilePanel] = useState<SearchPanel>(null);
  const [suggestionTab, setSuggestionTab] = useState<SuggestionTab>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timePreset, setTimePreset] = useState("");

  const isTurkish = locale === "tr" || locale.startsWith("tr-");
  const copy = isTurkish ? UI_COPY.tr : UI_COPY.en;
  const dateLocale = isTurkish ? tr : enUS;
  const today = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today]);

  const normalizedQuery = query.trim().toLocaleLowerCase(isTurkish ? "tr-TR" : locale);
  const matchingCategories = useMemo(
    () =>
      categories
        .filter((item) =>
          getCategoryLabel(item.slug, item.name)
            .toLocaleLowerCase(isTurkish ? "tr-TR" : locale)
            .includes(normalizedQuery),
        )
        .slice(0, 7),
    [categories, isTurkish, locale, normalizedQuery],
  );
  const matchingBusinesses = useMemo(
    () =>
      businesses
        .filter((item) => {
          const haystack = [item.name, item.city, item.district, item.categoryName]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(isTurkish ? "tr-TR" : locale);
          return haystack.includes(normalizedQuery);
        })
        .slice(0, 6),
    [businesses, isTurkish, locale, normalizedQuery],
  );
  const matchingCities = useMemo(
    () =>
      cities
        .filter(({ city: itemCity }) =>
          itemCity.toLocaleLowerCase(isTurkish ? "tr-TR" : locale).includes(
            city.trim().toLocaleLowerCase(isTurkish ? "tr-TR" : locale),
          ),
        )
        .slice(0, 8),
    [cities, city, isTurkish, locale],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActivePanel(null);
        setMobilePanel(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function closePanels() {
    setActivePanel(null);
    setMobilePanel(null);
  }

  function submitSearch() {
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();

    if (trimmedQuery) params.set("q", trimmedQuery);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (selectedDate) {
      params.set("date", toDateKey(selectedDate));
      if (isSameDay(selectedDate, today)) params.set("availability", "today");
      if (isSameDay(selectedDate, tomorrow)) params.set("availability", "tomorrow");
    }
    if (timePreset) params.set("time", timePreset);
    if (!selectedDate && timePreset === "evening") params.set("availability", "evening");

    const search = params.toString();
    closePanels();
    router.push(search ? `${exploreHref}?${search}` : exploreHref);
  }

  function selectCategory(item: { name: string; slug: string }) {
    setQuery(getCategoryLabel(item.slug, item.name));
    setCategory(item.slug);
    closePanels();
  }

  function selectBusiness(item: SearchBusiness) {
    setQuery(item.name);
    setCategory("");
    closePanels();
  }

  function selectCity(value: string) {
    setCity(value);
    closePanels();
  }

  function clearDate() {
    setSelectedDate(undefined);
    setTimePreset("");
  }

  const selectedTimeLabel = TIME_PRESETS.find((item) => item.value === timePreset)?.label;
  const dateLabel = selectedDate
    ? `${format(selectedDate, "d MMM", { locale: dateLocale })}${
        selectedTimeLabel && timePreset ? `, ${selectedTimeLabel}` : ""
      }`
    : selectedTimeLabel || labels.datePlaceholder;
  const serviceValue = query || labels.searchPlaceholder;
  const locationValue = city || labels.regionPlaceholder;
  const serviceHasResults =
    (suggestionTab !== "businesses" && matchingCategories.length > 0) ||
    (suggestionTab !== "services" && matchingBusinesses.length > 0);

  const serviceSuggestions = (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", copy.all],
            ["services", copy.services],
            ["businesses", copy.businesses],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={suggestionTab === value}
            className={cn(
              "min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              suggestionTab === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-surface-cream",
            )}
            onClick={() => setSuggestionTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold">{copy.suggestions}</h3>
          {query && (
            <button
              type="button"
              className="min-h-11 px-2 text-sm font-medium text-brand-purple-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setQuery("");
                setCategory("");
              }}
            >
              {copy.clear}
            </button>
          )}
        </div>

        <div className="grid gap-1">
          {suggestionTab !== "businesses" &&
            matchingCategories.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                className="flex min-h-16 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-purple focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => selectCategory(item)}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
                  {index === 0 ? <Grid2X2 className="size-5" /> : <Scissors className="size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {getCategoryLabel(item.slug, item.name)}
                  </span>
                  <span className="block text-sm text-muted-foreground">{copy.services}</span>
                </span>
              </button>
            ))}

          {suggestionTab !== "services" &&
            matchingBusinesses.map((item) => (
              <button
                key={item.slug}
                type="button"
                className="flex min-h-16 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => selectBusiness(item)}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-pink text-brand-pink-foreground">
                  <Building2 className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[item.categoryName, item.district, item.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))}

          {!serviceHasResults && (
            <div className="rounded-xl bg-surface-cream px-4 py-6 text-center text-sm text-muted-foreground">
              {copy.noResults}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const locationSuggestions = (
    <div className="grid gap-1">
      <button
        type="button"
        className="flex min-h-16 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => selectCity("")}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
          <MapPin className="size-5" />
        </span>
        <span>
          <span className="block font-medium">{copy.allRegions}</span>
          <span className="block text-sm text-muted-foreground">{copy.country}</span>
        </span>
      </button>
      {matchingCities.map((item) => (
        <button
          key={item.city}
          type="button"
          className="flex min-h-16 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => selectCity(item.city)}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
            <MapPin className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{item.city}</span>
            <span className="block text-sm text-muted-foreground">
              {item.count ? `${item.count} ${copy.businesses.toLocaleLowerCase(locale)}` : copy.country}
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  const quickDates = (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-3">
      {[
        { label: copy.today, date: today },
        { label: copy.tomorrow, date: tomorrow },
      ].map((item) => (
        <button
          key={item.label}
          type="button"
          aria-pressed={selectedDate ? isSameDay(selectedDate, item.date) : false}
          className={cn(
            "min-h-20 rounded-xl border border-border bg-background px-3 py-3 text-center transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-24",
            selectedDate &&
              isSameDay(selectedDate, item.date) &&
              "border-brand-purple-foreground bg-surface-purple",
          )}
          onClick={() => setSelectedDate(item.date)}
        >
          <span className="block font-medium">{item.label}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {format(item.date, "d MMM EEE", { locale: dateLocale })}
          </span>
        </button>
      ))}
    </div>
  );

  const timeOptions = (
    <div>
      <p className="mb-3 text-sm font-semibold">{copy.selectTime}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TIME_PRESETS.map((item) => (
          <button
            key={item.value || "any"}
            type="button"
            aria-pressed={timePreset === item.value}
            className={cn(
              "min-h-14 min-w-32 shrink-0 rounded-xl border border-border bg-background px-4 py-2 text-center text-sm transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              timePreset === item.value &&
                "border-brand-purple-foreground bg-surface-purple text-brand-purple-foreground",
            )}
            onClick={() => setTimePreset(item.value)}
          >
            <span className="block font-medium">{isTurkish ? item.label : item.labelEn}</span>
            {item.detail && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const datePicker = (
    <Calendar
      mode="single"
      locale={dateLocale}
      selected={selectedDate}
      onSelect={setSelectedDate}
      disabled={{ before: today }}
      showOutsideDays={false}
      className="mx-auto w-full bg-transparent p-0 [--cell-size:--spacing(9)]"
      classNames={{
        root: "w-full",
        month: "w-full",
        weekdays: "grid grid-cols-7",
        week: "mt-2 grid w-full grid-cols-7",
      }}
    />
  );

  return (
    <form
      action={exploreHref}
      className={cn(
        "relative w-full text-left",
        compact ? "mx-0 mt-0 max-w-xl" : "mx-auto mt-8 max-w-6xl md:mt-10",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <input type="hidden" name="q" value={query} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="city" value={city} />
      {selectedDate && <input type="hidden" name="date" value={toDateKey(selectedDate)} />}
      {timePreset && <input type="hidden" name="time" value={timePreset} />}

      {activePanel && (
        <button
          type="button"
          aria-label="Arama panelini kapat"
          className="fixed inset-0 z-30 hidden cursor-default bg-foreground/10 md:block"
          onClick={() => setActivePanel(null)}
        />
      )}

      {!compact && (
        <div className="rounded-3xl border border-border/70 bg-background p-3 shadow-lg md:hidden">
          <div className="grid gap-2">
            <button
              type="button"
              className="flex min-h-14 items-center gap-3 rounded-xl border border-input bg-background px-4 text-left transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => setMobilePanel("service")}
            >
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <span className={cn("min-w-0 flex-1 truncate", !query && "text-muted-foreground")}>
                {serviceValue}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex min-h-14 items-center gap-3 rounded-xl border border-input bg-background px-4 text-left transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => setMobilePanel("location")}
            >
              <MapPin className="size-5 shrink-0 text-muted-foreground" />
              <span className={cn("min-w-0 flex-1 truncate", !city && "text-muted-foreground")}>
                {locationValue}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex min-h-14 items-center gap-3 rounded-xl border border-input bg-background px-4 text-left transition-colors hover:bg-surface-cream focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => setMobilePanel("date")}
            >
              <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  !selectedDate && !timePreset && "text-muted-foreground",
                )}
              >
                {dateLabel}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <Button type="submit" variant="brand" size="lg" className="h-14 w-full rounded-xl text-base">
              {labels.submit}
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative z-40 hidden grid-cols-[1.2fr_0.9fr_1fr_auto] items-center overflow-hidden rounded-full border border-border/70 bg-background shadow-lg md:grid",
          compact ? "h-11 p-1" : "h-[4.5rem] p-1.5",
        )}
      >
        <div
          className={cn(
            "flex h-full min-w-0 items-center gap-2 rounded-full transition-colors",
            compact ? "px-3.5" : "gap-3 px-5",
            activePanel === "service" ? "bg-surface-cream shadow-sm" : "hover:bg-surface-cream/70",
          )}
        >
          <Search className={cn("shrink-0 text-muted-foreground", compact ? "size-4" : "size-5")} />
          <label className="sr-only" htmlFor="home-search-query">
            {labels.searchPlaceholder}
          </label>
          <input
            id="home-search-query"
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            autoComplete="off"
            className={cn(
              "h-full min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-foreground",
              compact ? "text-sm" : "text-[15px]",
            )}
            onFocus={() => setActivePanel("service")}
            onChange={(event) => {
              setQuery(event.target.value);
              setCategory("");
              setActivePanel("service");
            }}
          />
          {query && (
            <button
              type="button"
              aria-label={copy.clear}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => {
                setQuery("");
                setCategory("");
              }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          aria-expanded={activePanel === "location"}
          className={cn(
            "flex h-full min-w-0 items-center gap-2 rounded-full text-left transition-colors",
            compact ? "px-3.5" : "gap-3 px-5",
            activePanel === "location" ? "bg-surface-cream shadow-sm" : "hover:bg-surface-cream/70",
          )}
          onClick={() => setActivePanel("location")}
        >
          <MapPin className={cn("shrink-0 text-muted-foreground", compact ? "size-4" : "size-5")} />
          <span
            className={cn(
              "truncate font-medium",
              compact ? "text-sm" : "text-[15px]",
              !city && "text-foreground",
            )}
          >
            {locationValue}
          </span>
        </button>

        <button
          type="button"
          aria-expanded={activePanel === "date"}
          className={cn(
            "flex h-full min-w-0 items-center gap-2 rounded-full text-left transition-colors",
            compact ? "px-3.5" : "gap-3 px-5",
            activePanel === "date" ? "bg-surface-cream shadow-sm" : "hover:bg-surface-cream/70",
          )}
          onClick={() => setActivePanel("date")}
        >
          <CalendarDays className={cn("shrink-0 text-muted-foreground", compact ? "size-4" : "size-5")} />
          <span className={cn("truncate font-medium", compact ? "text-sm" : "text-[15px]")}>
            {dateLabel}
          </span>
        </button>

        <Button
          type="submit"
          size={compact ? "sm" : undefined}
          className={cn(
            "rounded-full font-semibold",
            compact ? "h-9 px-4 text-sm" : "h-14 px-7 text-base",
          )}
        >
          {labels.submit}
        </Button>
      </div>

      <div
        role="dialog"
        aria-label={copy.serviceTitle}
        className={cn(
          "absolute left-0 top-[calc(100%+0.75rem)] z-40 hidden max-h-[min(38rem,calc(100vh-8rem))] w-[min(46rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border/70 bg-background p-6 shadow-lg md:block",
          activePanel !== "service" && "md:hidden",
        )}
      >
        {serviceSuggestions}
      </div>

      <div
        role="dialog"
        aria-label={copy.locationTitle}
        className={cn(
          "absolute left-[28%] top-[calc(100%+0.75rem)] z-40 hidden max-h-[min(36rem,calc(100vh-8rem))] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border/70 bg-background p-5 shadow-lg md:block",
          activePanel !== "location" && "md:hidden",
        )}
      >
        <label className="mb-3 flex min-h-12 items-center gap-3 rounded-xl border border-input px-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <span className="sr-only">{labels.regionPlaceholder}</span>
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={city}
            placeholder={labels.regionPlaceholder}
            className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            onChange={(event) => setCity(event.target.value)}
          />
        </label>
        {locationSuggestions}
      </div>

      <div
        role="dialog"
        aria-label={copy.dateTitle}
        className={cn(
          "absolute right-0 top-[calc(100%+0.75rem)] z-40 hidden w-[min(50rem,calc(100vw-2rem))] rounded-2xl border border-border/70 bg-background p-6 shadow-lg md:block",
          activePanel !== "date" && "md:hidden",
        )}
      >
        <div className="grid grid-cols-[12rem_1fr] gap-7">
          {quickDates}
          {datePicker}
        </div>
        <div className="mt-6 border-t border-border/70 pt-5">{timeOptions}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="lg" onClick={clearDate}>
            {copy.clear}
          </Button>
          <Button type="button" size="lg" onClick={closePanels}>
            {copy.done}
          </Button>
        </div>
      </div>

      <Sheet
        open={isMobile && mobilePanel !== null}
        onOpenChange={(open) => {
          if (!open) setMobilePanel(null);
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full max-w-none gap-0 border-0 md:hidden data-[side=right]:w-full data-[side=right]:sm:max-w-none"
        >
          <SheetHeader className="flex-row items-center gap-2 border-b border-border/70 px-3 py-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Geri"
              onClick={() => setMobilePanel(null)}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <SheetTitle className="text-lg font-semibold">
                {mobilePanel === "service"
                  ? copy.serviceTitle
                  : mobilePanel === "location"
                    ? copy.locationTitle
                    : copy.dateTitle}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {mobilePanel === "service"
                  ? labels.searchPlaceholder
                  : mobilePanel === "location"
                    ? labels.regionPlaceholder
                    : labels.datePlaceholder}
              </SheetDescription>
            </div>
          </SheetHeader>

          {mobilePanel === "service" && (
            <>
              <div className="border-b border-border/70 p-4">
                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-input px-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <span className="sr-only">{labels.searchPlaceholder}</span>
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    placeholder={labels.searchPlaceholder}
                    className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setCategory("");
                    }}
                  />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{serviceSuggestions}</div>
            </>
          )}

          {mobilePanel === "location" && (
            <>
              <div className="border-b border-border/70 p-4">
                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-input px-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                  <span className="sr-only">{labels.regionPlaceholder}</span>
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    autoFocus
                    value={city}
                    placeholder={labels.regionPlaceholder}
                    className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    onChange={(event) => setCity(event.target.value)}
                  />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{locationSuggestions}</div>
            </>
          )}

          {mobilePanel === "date" && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-5">
                {quickDates}
                <div className="mt-7">{datePicker}</div>
                <div className="mt-7 border-t border-border/70 pt-5">{timeOptions}</div>
              </div>
              <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border/70 bg-background p-4">
                <Button type="button" variant="outline" size="lg" className="h-12" onClick={clearDate}>
                  {copy.clear}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="h-12"
                  onClick={() => setMobilePanel(null)}
                >
                  {copy.done}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </form>
  );
}
