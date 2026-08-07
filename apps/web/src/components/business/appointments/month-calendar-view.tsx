"use client";

import {
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toDateKey, timeToMinutes } from "@/lib/calendar";
import { getAppointmentCustomerName } from "./types";
import {
  CALENDAR_STATUS_CARD_CLASSES,
  BLOCKED_TIME_PSEUDO_STATUS,
} from "@/lib/constants/calendar";
import type {
  CalendarSelection,
  CalendarBlockedTime,
  SerializedCalendarAppointment,
} from "./types";

const MAX_VISIBLE_ITEMS = 3;

interface MonthCalendarViewProps {
  date: Date;
  appointments: SerializedCalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  selection: CalendarSelection;
  onSelectAppointment: (appointment: SerializedCalendarAppointment) => void;
  onSelectBlockedTime: (blockedTime: CalendarBlockedTime) => void;
  onDrillDown: (date: Date) => void;
}

type DayItem =
  | { kind: "appointment"; id: string; startTime: string; appointment: SerializedCalendarAppointment }
  | { kind: "blocked"; id: string; startTime: string; blockedTime: CalendarBlockedTime };

export function MonthCalendarView({
  date,
  appointments,
  blockedTimes,
  selection,
  onSelectAppointment,
  onSelectBlockedTime,
  onDrillDown,
}: MonthCalendarViewProps) {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-border/50">
      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30 text-center text-xs font-medium text-muted-foreground">
        {days.slice(0, 7).map((d) => (
          <div key={d.toISOString()} className="py-2 capitalize">
            {format(d, "EEE", { locale: tr })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const items: DayItem[] = [
            ...appointments
              .filter((a) => toDateKey(a.requestedDate) === dateKey)
              .map((a) => ({
                kind: "appointment" as const,
                id: a.id,
                startTime: a.requestedTime,
                appointment: a,
              })),
            ...blockedTimes
              .filter((b) => toDateKey(b.date) === dateKey)
              .map((b) => ({
                kind: "blocked" as const,
                id: b.id,
                startTime: b.startTime,
                blockedTime: b,
              })),
          ].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

          const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);
          const hiddenCount = items.length - visibleItems.length;
          const isCurrentMonth = isSameMonth(day, date);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDrillDown(day)}
              className={cn(
                "flex min-h-24 flex-col items-stretch gap-1 border-b border-r border-border/50 p-1.5 text-left align-top last:border-r-0 hover:bg-muted/30 sm:min-h-32 sm:p-2",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground/60"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-brand-pink text-brand-pink-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-1">
                {visibleItems.map((item) => {
                  if (item.kind === "appointment") {
                    const a = item.appointment;
                    const isSelected =
                      selection?.kind === "appointment" && selection.appointment.id === a.id;
                    return (
                      <span
                        key={`appt:${a.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment(a);
                          onDrillDown(day);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.stopPropagation();
                          onSelectAppointment(a);
                          onDrillDown(day);
                        }}
                        className={cn(
                          "truncate rounded border-l-2 px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]",
                          CALENDAR_STATUS_CARD_CLASSES[a.status],
                          isSelected && "ring-2 ring-ring"
                        )}
                      >
                        {a.requestedTime} {getAppointmentCustomerName(a)}
                      </span>
                    );
                  }

                  const b = item.blockedTime;
                  const isSelected = selection?.kind === "blocked" && selection.blockedTime.id === b.id;
                  return (
                    <span
                      key={`blocked:${b.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlockedTime(b);
                        onDrillDown(day);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.stopPropagation();
                        onSelectBlockedTime(b);
                        onDrillDown(day);
                      }}
                      className={cn(
                        "truncate rounded border-l-2 px-1 py-0.5 text-[10px] leading-tight sm:text-[11px]",
                        CALENDAR_STATUS_CARD_CLASSES[BLOCKED_TIME_PSEUDO_STATUS],
                        isSelected && "ring-2 ring-ring"
                      )}
                    >
                      {b.startTime} {b.reason || "Bloklu"}
                    </span>
                  );
                })}
                {hiddenCount > 0 && (
                  <span className="truncate px-1 text-[10px] text-muted-foreground sm:text-[11px]">
                    +{hiddenCount} daha
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
