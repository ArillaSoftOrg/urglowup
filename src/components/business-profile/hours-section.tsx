import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
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

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
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

export function isBusinessOpen(
  hours: BusinessWithDetails["hours"]
): boolean {
  const today = getTodayDayOfWeek();
  const todayHours = hours.find((h) => h.dayOfWeek === today);
  if (!todayHours?.isOpen || !todayHours.openTime || !todayHours.closeTime)
    return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= todayHours.openTime && currentTime < todayHours.closeTime;
}

export function HoursSection({
  business,
}: {
  business: BusinessWithDetails;
}) {
  if (business.hours.length === 0) return null;

  const today = getTodayDayOfWeek();
  const open = isBusinessOpen(business.hours);

  // Sort hours in day order
  const sorted = DAY_ORDER.map((day) =>
    business.hours.find((h) => h.dayOfWeek === day)
  ).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Working Hours
          </CardTitle>
          <Badge variant={open ? "default" : "secondary"}>
            {open ? "Open now" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.map((hour) => {
            if (!hour) return null;
            const isToday = hour.dayOfWeek === today;
            return (
              <div
                key={hour.dayOfWeek}
                className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                  isToday ? "bg-accent font-medium" : ""
                }`}
              >
                <span>{DAY_SHORT[hour.dayOfWeek]}</span>
                <span className="text-muted-foreground">
                  {hour.isOpen && hour.openTime && hour.closeTime
                    ? `${formatTime(hour.openTime)} - ${formatTime(hour.closeTime)}`
                    : "Closed"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
