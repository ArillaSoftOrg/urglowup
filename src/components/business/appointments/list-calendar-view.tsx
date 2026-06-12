"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toDateKey, timeToMinutes } from "@/lib/calendar";
import { AppointmentCard } from "./appointment-card";
import type {
  CalendarSelection,
  CalendarBlockedTime,
  SerializedCalendarAppointment,
} from "./types";

interface ListCalendarViewProps {
  selectedDate: Date;
  appointments: SerializedCalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  selection: CalendarSelection;
  onSelectAppointment: (appointment: SerializedCalendarAppointment) => void;
  onSelectBlockedTime: (blockedTime: CalendarBlockedTime) => void;
}

type DayItem =
  | { kind: "appointment"; id: string; startTime: string; appointment: SerializedCalendarAppointment }
  | { kind: "blocked"; id: string; startTime: string; blockedTime: CalendarBlockedTime };

export function ListCalendarView({
  selectedDate,
  appointments,
  blockedTimes,
  selection,
  onSelectAppointment,
  onSelectBlockedTime,
}: ListCalendarViewProps) {
  const fromKey = toDateKey(selectedDate);

  const itemsByDate = new Map<string, DayItem[]>();

  for (const a of appointments) {
    const dateKey = toDateKey(a.requestedDate);
    if (dateKey < fromKey) continue;
    const list = itemsByDate.get(dateKey) ?? [];
    list.push({ kind: "appointment", id: a.id, startTime: a.requestedTime, appointment: a });
    itemsByDate.set(dateKey, list);
  }

  for (const b of blockedTimes) {
    const dateKey = toDateKey(b.date);
    if (dateKey < fromKey) continue;
    const list = itemsByDate.get(dateKey) ?? [];
    list.push({ kind: "blocked", id: b.id, startTime: b.startTime, blockedTime: b });
    itemsByDate.set(dateKey, list);
  }

  const sortedDateKeys = Array.from(itemsByDate.keys()).sort();

  if (sortedDateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        Bu tarihten itibaren randevu bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDateKeys.map((dateKey) => {
        const items = itemsByDate
          .get(dateKey)!
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        return (
          <div key={dateKey} className="space-y-2">
            <h3 className="text-sm font-semibold capitalize">
              {format(new Date(`${dateKey}T00:00:00`), "d MMMM yyyy, EEEE", { locale: tr })}
            </h3>
            <div className="space-y-2">
              {items.map((item) => {
                if (item.kind === "appointment") {
                  const a = item.appointment;
                  const isSelected =
                    selection?.kind === "appointment" && selection.appointment.id === a.id;
                  return (
                    <AppointmentCard
                      key={`appt:${a.id}`}
                      item={a}
                      kind="appointment"
                      variant="list"
                      selected={isSelected}
                      onClick={() => onSelectAppointment(a)}
                    />
                  );
                }

                const b = item.blockedTime;
                const isSelected = selection?.kind === "blocked" && selection.blockedTime.id === b.id;
                return (
                  <AppointmentCard
                    key={`blocked:${b.id}`}
                    item={b}
                    kind="blocked"
                    variant="list"
                    selected={isSelected}
                    onClick={() => onSelectBlockedTime(b)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
