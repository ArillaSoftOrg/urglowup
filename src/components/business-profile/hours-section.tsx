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
    <div className="grid gap-10 rounded-[2px] bg-background px-2 py-2 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] md:gap-14 lg:max-w-5xl">
      <section aria-labelledby="opening-hours-title" className="space-y-5">
        <h2 id="opening-hours-title" className="text-[28px] font-bold tracking-normal text-foreground">
          Açılış saatleri
        </h2>
        <div className="space-y-3">
          {sorted.map((hour) => {
            if (!hour) return null;

            const isToday = hour.dayOfWeek === today;
            const hasHours = hour.isOpen && hour.openTime && hour.closeTime;

            return (
              <div
                key={hour.dayOfWeek}
                className="grid grid-cols-[1fr_auto] items-center gap-8 text-[21px] leading-7 text-foreground"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    aria-hidden="true"
                    className={`size-4 shrink-0 rounded-full ${
                      hasHours ? "bg-[oklch(0.68_0.17_142)]" : "bg-muted-foreground/35"
                    }`}
                  />
                  <span className={isToday ? "font-bold" : "font-medium"}>
                    {DAY_LABELS[hour.dayOfWeek]}
                  </span>
                </span>
                <span className={isToday ? "font-bold" : "font-medium"}>
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
        <section aria-labelledby="profile-features-title" className="space-y-6">
          <h2 id="profile-features-title" className="text-[28px] font-bold tracking-normal text-foreground">
            Ek bilgiler
          </h2>
          <div className="space-y-5">
            {visibleFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.key} className="flex items-center gap-3 text-[21px] font-medium leading-7 text-foreground">
                  <Icon className="size-5 shrink-0 stroke-[1.8]" />
                  <span>{feature.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
