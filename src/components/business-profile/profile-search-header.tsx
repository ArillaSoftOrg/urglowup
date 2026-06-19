"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  MapPin,
  Search,
  Scissors,
  X,
} from "lucide-react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ActivePanel = "service" | "location" | "time" | null;

const SERVICE_SUGGESTIONS = [
  "Tüm işlemler",
  "Saç ve şekillendirme",
  "Tırnak Bakımı",
  "Epilasyon",
  "Cilt bakımı",
  "Masaj",
  "Kaş ve kirpik",
];

const LOCATION_SUGGESTIONS = [
  { title: "Mevcut konum", subtitle: "Yakınımdaki işletmeleri göster" },
  { title: "İstanbul", subtitle: "Türkiye" },
  { title: "Ankara", subtitle: "Türkiye" },
  { title: "İzmir", subtitle: "Türkiye" },
  { title: "Antalya", subtitle: "Türkiye" },
  { title: "Bursa", subtitle: "Türkiye" },
];

const TIME_PRESETS = [
  { label: "Herhangi bir zaman", value: "" },
  { label: "Sabah", detail: "09 - 12", value: "morning" },
  { label: "Öğleden sonra", detail: "12 - 17", value: "afternoon" },
  { label: "Akşam", detail: "17 - 00", value: "evening" },
];

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthDays(month: Date) {
  const start = startOfMonth(month);
  const firstDay = (start.getDay() + 6) % 7;
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(start.getFullYear(), start.getMonth(), index + 1)),
  ];
}

export function ProfileSearchHeader({ locale }: { locale?: string }) {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timePreset, setTimePreset] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const exploreHref = locale && locale !== "tr" ? `/${locale}/explore` : "/explore";
  const days = useMemo(() => monthDays(visibleMonth), [visibleMonth]);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setActivePanel(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function submitSearch() {
    const params = new URLSearchParams();
    const trimmedService = service.trim();
    const trimmedLocation = location.trim();

    if (trimmedService && trimmedService !== "Tüm işlemler") params.set("q", trimmedService);
    if (trimmedLocation && trimmedLocation !== "Mevcut konum") params.set("city", trimmedLocation);
    if (selectedDate) params.set("date", toDateKey(selectedDate));
    if (timePreset) params.set("time", timePreset);

    router.push(`${exploreHref}${params.size ? `?${params.toString()}` : ""}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
    if (event.key === "Escape") setActivePanel(null);
  }

  function selectService(value: string) {
    setService(value);
    setActivePanel("location");
  }

  function selectLocation(value: string) {
    setLocation(value === "Mevcut konum" ? "" : value);
    setActivePanel("time");
  }

  function selectQuickDate(date: Date) {
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  }

  const timeLabel = selectedDate
    ? format(selectedDate, "d MMM", { locale: tr })
    : TIME_PRESETS.find((item) => item.value === timePreset)?.label || "Herhangi bir zaman";

  return (
    <form
      ref={rootRef}
      action={exploreHref}
      className="profile-search-root relative mx-auto w-full max-w-[1120px]"
    >
      <style>{`
        .profile-search-root:has([data-panel="service"]:focus) [data-service-panel],
        .profile-search-root:has([data-service-panel]:focus-within) [data-service-panel],
        .profile-search-root:has([data-panel="location"]:focus) [data-location-panel],
        .profile-search-root:has([data-location-panel]:focus-within) [data-location-panel],
        .profile-search-root:has([data-panel="time"]:focus) [data-time-panel],
        .profile-search-root:has([data-time-panel]:focus-within) [data-time-panel] {
          display: block;
        }
      `}</style>
      {activePanel && (
        <button
          type="button"
          aria-label="Arama panelini kapat"
          className="fixed inset-0 top-20 z-30 cursor-default bg-foreground/25"
          onClick={() => setActivePanel(null)}
        />
      )}

      <div className="relative z-40 grid h-14 grid-cols-[1.1fr_1fr_1fr_auto] items-center overflow-hidden rounded-full border bg-background shadow-md">
        <label
          className={cn(
            "flex h-full min-w-0 items-center gap-3 border-r px-5 transition-colors",
            activePanel === "service" ? "bg-background shadow-lg" : "hover:bg-muted/50",
          )}
          onClick={() => setActivePanel("service")}
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            name="q"
            data-panel="service"
            value={service}
            onFocus={() => setActivePanel("service")}
            onChange={(event) => {
              setService(event.target.value);
              setActivePanel("service");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tüm işlemler"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-foreground"
          />
          {service && (
            <button
              type="button"
              aria-label="İşlem aramasını temizle"
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setService("")}
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <label
          className={cn(
            "flex h-full min-w-0 items-center gap-3 border-r px-5 transition-colors",
            activePanel === "location" ? "bg-background shadow-lg" : "hover:bg-muted/50",
          )}
          onClick={() => setActivePanel("location")}
        >
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <input
            name="city"
            data-panel="location"
            value={location}
            onFocus={() => setActivePanel("location")}
            onChange={(event) => {
              setLocation(event.target.value);
              setActivePanel("location");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Mevcut konum"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-foreground"
          />
          {location && (
            <button
              type="button"
              aria-label="Konumu temizle"
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setLocation("")}
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <button
          type="button"
          data-panel="time"
          className={cn(
            "flex h-full min-w-0 items-center gap-3 px-5 text-left transition-colors",
            activePanel === "time" ? "bg-background shadow-lg" : "hover:bg-muted/50",
          )}
          onClick={() => setActivePanel("time")}
        >
          <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
          <span className="truncate text-[15px] font-medium">{timeLabel}</span>
        </button>
        {selectedDate && <input type="hidden" name="date" value={toDateKey(selectedDate)} />}
        {timePreset && <input type="hidden" name="time" value={timePreset} />}

        <button
          type="submit"
          className="mr-1.5 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-[15px] font-bold text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={submitSearch}
        >
          Ara
        </button>
      </div>

      <div
        data-service-panel
        tabIndex={-1}
        className="absolute left-0 top-[calc(100%+14px)] z-40 hidden max-h-[calc(100vh-8rem)] w-[min(45rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-foreground/10"
      >
          <div className="mb-5 flex flex-wrap gap-2">
            {["Tümü", "İşlemler", "Mekanlar", "Uzmanlar"].map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "h-9 rounded-full border px-5 text-sm font-semibold",
                  index === 0 ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Son Eklenenler</h2>
            <button
              type="button"
              className="text-sm font-medium text-brand-purple-foreground hover:underline"
              onClick={() => setService("")}
            >
              Temizle
            </button>
          </div>

          <div className="grid gap-1.5">
            {SERVICE_SUGGESTIONS.filter((item) =>
              item.toLocaleLowerCase("tr").includes(service.toLocaleLowerCase("tr").trim()),
            ).map((item, index) => {
              const Icon = index === 0 ? Grid2X2 : index < 4 ? Search : Scissors;
              return (
                <button
                  key={item}
                  type="button"
                  className="flex items-center gap-4 rounded-xl px-1 py-2 text-left transition hover:bg-muted/60"
                  onClick={() => selectService(item)}
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold">{item}</span>
                    <span className="text-sm text-muted-foreground">{timeLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
      </div>

      <div
        data-location-panel
        tabIndex={-1}
        className="absolute left-[34%] top-[calc(100%+14px)] z-40 hidden w-[min(34rem,calc(100vw-2rem))] rounded-2xl bg-background p-5 shadow-2xl ring-1 ring-foreground/10"
      >
          <div className="grid gap-1">
            {LOCATION_SUGGESTIONS.filter((item) =>
              item.title.toLocaleLowerCase("tr").includes(location.toLocaleLowerCase("tr").trim()),
            ).map((item) => (
              <button
                key={item.title}
                type="button"
                className="flex items-center gap-4 rounded-xl px-1 py-2 text-left transition hover:bg-muted/60"
                onClick={() => selectLocation(item.title)}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
                  <MapPin className="size-5 fill-current" />
                </span>
                <span>
                  <span className="block text-base font-semibold">{item.title}</span>
                  <span className="text-sm text-muted-foreground">{item.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
      </div>

      <div
        data-time-panel
        tabIndex={-1}
        className="absolute right-0 top-[calc(100%+14px)] z-40 hidden w-[min(50rem,calc(100vw-2rem))] rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-foreground/10"
      >
          <div className="grid grid-cols-[13rem_1fr] gap-8">
            <div className="grid content-start gap-4">
              {[
                { label: "Bugün", date: today },
                { label: "Yarın", date: tomorrow },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "rounded-2xl border p-5 text-center transition hover:bg-muted/60",
                    selectedDate && toDateKey(selectedDate) === toDateKey(item.date) && "border-foreground",
                  )}
                  onClick={() => selectQuickDate(item.date)}
                >
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {format(item.date, "d MMM EEE", { locale: tr })}
                  </span>
                </button>
              ))}
            </div>

            <div>
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Önceki ay"
                  className="rounded-full p-2 hover:bg-muted"
                  onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <h2 className="text-lg font-bold capitalize">
                  {format(visibleMonth, "MMM yyyy", { locale: tr })}
                </h2>
                <button
                  type="button"
                  aria-label="Sonraki ay"
                  className="rounded-full p-2 hover:bg-muted"
                  onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-3 text-center text-sm">
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                  <span key={day} className="font-medium text-muted-foreground">{day}</span>
                ))}
                {days.map((day, index) => {
                  const isSelected = day && selectedDate && toDateKey(day) === toDateKey(selectedDate);
                  const isPast = day && toDateKey(day) < toDateKey(today);
                  return (
                    <span key={day ? toDateKey(day) : `empty-${index}`} className="flex justify-center">
                      {day ? (
                        <button
                          type="button"
                          disabled={!!isPast}
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full text-sm font-medium transition hover:bg-muted disabled:text-muted-foreground/45 disabled:hover:bg-transparent",
                            isSelected && "border border-foreground",
                          )}
                          onClick={() => setSelectedDate(day)}
                        >
                          {format(day, "d")}
                        </button>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-5">
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              <span className="shrink-0 text-sm font-semibold">Saat seçin</span>
              {TIME_PRESETS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "min-h-14 shrink-0 rounded-2xl border px-5 text-center text-sm font-semibold transition hover:bg-muted/60",
                    timePreset === item.value && "border-brand-purple-foreground bg-surface-purple text-brand-purple-foreground",
                  )}
                  onClick={() => setTimePreset(item.value)}
                >
                  <span className="block">{item.label}</span>
                  {item.detail && <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>}
                </button>
              ))}
            </div>
          </div>
      </div>
    </form>
  );
}
