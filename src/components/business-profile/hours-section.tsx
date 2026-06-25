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
    <div className="space-y-8 border-t border-border/70 pt-8 md:grid md:max-w-5xl md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] md:gap-14 md:space-y-0 md:pt-10">
      <section aria-labelledby="opening-hours-title" className="space-y-4">
        <h2 id="opening-hours-title" className="text-lg font-bold tracking-normal md:text-2xl">
          Açılış saatleri
        </h2>
        <div className="space-y-3 md:space-y-3">
          {sorted.map((hour) => {
            if (!hour) return null;

            const isToday = hour.dayOfWeek === today;
            const hasHours = hour.isOpen && hour.openTime && hour.closeTime;

            return (
              <div
                key={hour.dayOfWeek}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-sm leading-5 text-foreground md:rounded-xl md:px-3 md:py-2 md:text-[15px]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`size-3 shrink-0 rounded-full ${
                      hasHours ? "bg-[#62c93b]" : "bg-muted-foreground/35"
                    }`}
                  />
                  <span className={isToday ? "font-bold" : hasHours ? "font-medium" : "font-semibold text-muted-foreground"}>
                    {DAY_LABELS[hour.dayOfWeek]}
                  </span>
                </span>
                <span className={isToday ? "font-bold" : hasHours ? "font-medium text-foreground" : "font-bold text-muted-foreground"}>
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
        <section aria-labelledby="profile-features-title" className="space-y-4 border-t border-border/70 pt-8 md:border-t-0 md:pt-0">
          <h2 id="profile-features-title" className="text-lg font-bold tracking-normal md:text-2xl">
            Ek bilgiler
          </h2>
          <div className="space-y-3 md:flex md:flex-wrap md:gap-2 md:space-y-0">
            {visibleFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <span
                  key={feature.key}
                  className="flex items-center gap-3 text-sm font-medium text-foreground md:inline-flex md:gap-2 md:rounded-full md:border md:border-border/80 md:bg-muted/40 md:px-4 md:py-2"
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
