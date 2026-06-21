"use client";

import { useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { CalendarOff } from "lucide-react";
import { getAvailableSlots } from "@/app/(public)/b/[slug]/book/actions";
import {
  MAX_ADVANCE_DAYS,
  nowInBusinessTimezone,
} from "@/lib/constants/booking";
import type { BookingBusiness } from "@/lib/queries/appointments";
import type { DayOfWeek } from "@/generated/prisma/enums";
import { WaitlistButton } from "./waitlist-button";

const DAY_INDEX_TO_ENUM: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export function DateTimePicker({
  business,
  serviceId,
  selectedDate,
  selectedTime,
  isLoggedIn,
  onSelectDate,
  onSelectTime,
}: {
  business: BookingBusiness;
  serviceId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  isLoggedIn?: boolean;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  const closedDays = new Set<number>();
  for (const hour of business.hours) {
    if (!hour.isOpen) {
      const dayIndex = Object.entries(DAY_INDEX_TO_ENUM).find(
        ([, v]) => v === hour.dayOfWeek
      )?.[0];
      if (dayIndex !== undefined) closedDays.add(Number(dayIndex));
    }
  }

  const appliedHolidayDates = new Set(
    business.holidaySuggestions.map((s) =>
      s.holiday.date.toISOString().slice(0, 10)
    )
  );

  const now = nowInBusinessTimezone();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    onSelectDate(date);
    setSlotsLoaded(false);

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    startTransition(async () => {
      const result = await getAvailableSlots(business.id, serviceId, dateStr);
      setSlots(result);
      setSlotsLoaded(true);
    });
  }

  function isDateDisabled(date: Date): boolean {
    if (date < today) return true;
    if (date > maxDate) return true;
    if (closedDays.has(date.getDay())) return true;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (appliedHolidayDates.has(dateStr)) return true;
    return false;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tarih ve saat seçin</h2>
        <p className="text-sm text-muted-foreground">
          Randevunuz için uygun bir zaman belirleyin
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {/* Calendar */}
        <div className="space-y-2">
          <div className="rounded-xl border bg-card p-2 shadow-sm">
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              startMonth={today}
              endMonth={maxDate}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Geçmiş ve kapalı günler seçilemez.
          </p>
        </div>

        {/* Time slots */}
        <div className="flex-1">
          {!selectedDate && (
            <div className="flex h-full items-center justify-center rounded-xl bg-surface-cream px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Tarih seçildikten sonra uygun saatler burada görünür.
              </p>
            </div>
          )}

          {selectedDate && isPending && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}

          {selectedDate && slotsLoaded && !isPending && slots.length === 0 && (
            <EmptyState
              icon={CalendarOff}
              headline="Uygun saat yok"
              description="Bu tarihte uygun saat kalmadı. Lütfen başka bir gün deneyin."
              surface="cream"
              compact
            />
          )}

          {selectedDate && slotsLoaded && !isPending && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <Button
                    key={slot}
                    type="button"
                    variant={isSelected ? "brand" : "outline"}
                    className={cn(
                      "h-10 text-sm font-medium",
                      isSelected && "ring-2 ring-brand-pink-foreground/30"
                    )}
                    onClick={() => onSelectTime(slot)}
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
