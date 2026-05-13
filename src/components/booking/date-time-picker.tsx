"use client";

import { useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getAvailableSlots } from "@/app/(public)/b/[slug]/book/actions";
import {
  MAX_ADVANCE_DAYS,
  nowInBusinessTimezone,
} from "@/lib/constants/booking";
import type { BookingBusiness } from "@/lib/queries/appointments";
import type { DayOfWeek } from "@/generated/prisma/enums";

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
  onSelectDate,
  onSelectTime,
}: {
  business: BookingBusiness;
  serviceId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  // Build set of closed days
  const closedDays = new Set<number>();
  for (const hour of business.hours) {
    if (!hour.isOpen) {
      const dayIndex = Object.entries(DAY_INDEX_TO_ENUM).find(
        ([, v]) => v === hour.dayOfWeek
      )?.[0];
      if (dayIndex !== undefined) closedDays.add(Number(dayIndex));
    }
  }

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
    // Past dates
    if (date < today) return true;
    // Beyond max advance
    if (date > maxDate) return true;
    // Closed day
    if (closedDays.has(date.getDay())) return true;
    return false;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pick a date &amp; time</h2>
        <p className="text-sm text-muted-foreground">
          Select when you&apos;d like your appointment
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Calendar */}
        <div className="shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            startMonth={today}
            endMonth={maxDate}
          />
        </div>

        {/* Time slots */}
        <div className="flex-1">
          {!selectedDate && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select a date to see available times
            </p>
          )}

          {selectedDate && isPending && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          )}

          {selectedDate && slotsLoaded && !isPending && slots.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No available slots for this date. Please try another day.
            </p>
          )}

          {selectedDate && slotsLoaded && !isPending && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={selectedTime === slot ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-sm",
                    selectedTime === slot && "ring-2 ring-primary ring-offset-1"
                  )}
                  onClick={() => onSelectTime(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
