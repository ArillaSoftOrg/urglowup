"use client";

import { useState, useTransition } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { CalendarDays, CalendarOff, UserRound } from "lucide-react";
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

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DateTimePicker({
  business,
  serviceId,
  durationMinutes,
  selectedDate,
  selectedTime,
  isLoggedIn,
  professionalName,
  onSelectDate,
  onSelectTime,
}: {
  business: BookingBusiness;
  serviceId: string;
  durationMinutes?: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  isLoggedIn?: boolean;
  professionalName?: string;
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
        ([, value]) => value === hour.dayOfWeek
      )?.[0];
      if (dayIndex !== undefined) closedDays.add(Number(dayIndex));
    }
  }

  const appliedHolidayDates = new Set(
    business.holidaySuggestions.map((suggestion) =>
      suggestion.holiday.date.toISOString().slice(0, 10)
    )
  );

  const now = nowInBusinessTimezone();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);

  function isDateDisabled(date: Date): boolean {
    if (date < today) return true;
    if (date > maxDate) return true;
    if (closedDays.has(date.getDay())) return true;
    if (appliedHolidayDates.has(toDateKey(date))) return true;
    return false;
  }

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    onSelectDate(date);
    setSlotsLoaded(false);

    startTransition(async () => {
      const result = await getAvailableSlots(
        business.id,
        serviceId,
        toDateKey(date),
        durationMinutes
      );
      setSlots(result);
      setSlotsLoaded(true);
    });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-bold tracking-tight">Tarih ve saati seçin</h2>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium shadow-xs">
          <span className="flex size-6 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
            <UserRound className="size-3.5" />
          </span>
          {professionalName ?? "Tercih yok"}
        </div>
        <div className="rounded-full border border-border bg-card p-2 shadow-xs">
          <CalendarDays className="size-5" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Tarih seçin</h3>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {Array.from({ length: 14 }).map((_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            const disabled = isDateDisabled(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            return (
              <button
                key={toDateKey(date)}
                type="button"
                disabled={disabled}
                onClick={() => handleDateSelect(date)}
                className={cn(
                  "flex min-h-[96px] min-w-[70px] flex-col items-center justify-center rounded-xl border bg-card px-3 text-center shadow-xs transition-colors disabled:opacity-40",
                  isSelected
                    ? "border-brand-purple-foreground bg-brand-purple-foreground text-background"
                    : "border-border hover:bg-surface-cream"
                )}
              >
                <span className="text-xs font-medium capitalize">
                  {new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date)}
                </span>
                <span className="mt-1 text-2xl font-bold">{date.getDate()}</span>
                <span className="text-xs">
                  {new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(date)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="hidden rounded-xl border bg-card p-2 shadow-sm lg:block">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            startMonth={today}
            endMonth={maxDate}
          />
        </div>

        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-semibold">Saat seçin</h3>

          {!selectedDate && (
            <div className="flex min-h-44 items-center justify-center rounded-xl bg-surface-cream px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Tarih seçildikten sonra uygun saatler burada görünür.
              </p>
            </div>
          )}

          {selectedDate && isPending && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )}

          {selectedDate && slotsLoaded && !isPending && slots.length === 0 && (
            <div className="space-y-4">
              <EmptyState
                icon={CalendarOff}
                headline={
                  professionalName
                    ? `${professionalName} bu tarihte tamamen dolu.`
                    : "Uygun saat yok"
                }
                description={
                  professionalName
                    ? "Başka bir tarih deneyin veya bekleme listesine girin."
                    : "Bu tarihte uygun saat kalmadı. Lütfen başka bir gün deneyin veya bekleme listesine girin."
                }
                surface="cream"
                compact
              />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  if (!isDateDisabled(next)) {
                    handleDateSelect(next);
                  } else {
                    const candidate = new Date(next);
                    for (let i = 0; i < 60; i++) {
                      candidate.setDate(candidate.getDate() + 1);
                      if (!isDateDisabled(candidate)) {
                        handleDateSelect(candidate);
                        break;
                      }
                    }
                  }
                }}
              >
                Sonraki uygun güne git
              </Button>
              <WaitlistButton
                businessId={business.id}
                serviceId={serviceId}
                date={toDateKey(selectedDate)}
                time="any"
                isLoggedIn={isLoggedIn ?? false}
              />
            </div>
          )}

          {selectedDate && slotsLoaded && !isPending && slots.length > 0 && (
            <div className="space-y-3 pb-28 lg:pb-0">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <Button
                    key={slot}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-14 w-full justify-between rounded-xl px-4 text-base font-medium",
                      isSelected &&
                        "border-brand-purple-foreground ring-2 ring-brand-purple-foreground/70"
                    )}
                    onClick={() => onSelectTime(slot)}
                  >
                    <span>{slot}</span>
                    {durationMinutes ? (
                      <span className="text-sm font-semibold">{durationMinutes} dk</span>
                    ) : null}
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
