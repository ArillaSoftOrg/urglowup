import { CircleCheck, CreditCard, PawPrint } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};

const FEATURE_OPTIONS = [
  {
    key: "instantConfirmation",
    label: "Anında onay",
    icon: CircleCheck,
  },
  {
    key: "inAppPayment",
    label: "Uygulama ile öde",
    icon: CreditCard,
  },
  {
    key: "petFriendly",
    label: "Evcil hayvan uygundur",
    icon: PawPrint,
  },
] as const;

function formatTime(time: string) {
  return time.substring(0, 5);
}

function getTodayDayOfWeek(): string {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return days[new Date().getDay()];
}

export function isBusinessOpen(hours: BusinessWithDetails["hours"]): boolean {
  const today = getTodayDayOfWeek();
  const todayHours = hours.find((h) => h.dayOfWeek === today);
  if (!todayHours?.isOpen || !todayHours.openTime || !todayHours.closeTime) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  return currentTime >= todayHours.openTime && currentTime < todayHours.closeTime;
}

export function HoursSection({ business }: { business: BusinessWithDetails }) {
  if (business.hours.length === 0) return null;

  const today = getTodayDayOfWeek();
  const sorted = DAY_ORDER.map((day) =>
    business.hours.find((h) => h.dayOfWeek === day)
  ).filter(Boolean);
  const visibleFeatures = FEATURE_OPTIONS.filter((feature) => business[feature.key]);

  return (
    <div className="space-y-9 border-t border-border/70 pt-8 md:grid md:max-w-5xl md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] md:gap-14 md:space-y-0 md:pt-10">
      <section aria-labelledby="opening-hours-title" className="space-y-5">
        <h2 id="opening-hours-title" className="text-2xl font-bold tracking-normal">
          Açılış saatleri
        </h2>
        <div className="space-y-2.5 md:space-y-3">
          {sorted.map((hour) => {
            if (!hour) return null;

            const isToday = hour.dayOfWeek === today;
            const hasHours = hour.isOpen && hour.openTime && hour.closeTime;

            return (
              <div
                key={hour.dayOfWeek}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-3 py-2 text-base leading-6 md:text-[15px] ${
                  hasHours
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3 md:gap-4">
                  <span
                    aria-hidden="true"
                    className={`size-3.5 shrink-0 rounded-full md:size-4 ${
                      hasHours ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  <span className={isToday ? "font-bold" : "font-medium"}>
                    {DAY_LABELS[hour.dayOfWeek]}
                  </span>
                </span>
                <span className={isToday ? "font-bold" : "font-medium opacity-80"}>
                  {hasHours
                    ? `${formatTime(hour.openTime!)} – ${formatTime(hour.closeTime!)}`
                    : "Kapalı"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {visibleFeatures.length > 0 && (
        <section aria-labelledby="profile-features-title" className="space-y-5 border-t border-border/70 pt-9 md:border-t-0 md:pt-0">
          <h2 id="profile-features-title" className="text-2xl font-bold tracking-normal">
            Ek bilgiler
          </h2>
          <div className="space-y-3 md:flex md:flex-wrap md:gap-2 md:space-y-0">
            {visibleFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <span
                  key={feature.key}
                  className="flex items-center gap-3 text-base font-medium text-foreground md:inline-flex md:gap-2 md:rounded-full md:border md:border-border/80 md:bg-muted/40 md:px-4 md:py-2 md:text-sm"
                >
                  <Icon className="size-4 shrink-0 stroke-[1.75]" />
                  {feature.label}
                </span>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
