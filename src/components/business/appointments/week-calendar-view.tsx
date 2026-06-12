"use client";

import { addDays, startOfWeek } from "date-fns";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarTimelineGrid, type TimelineColumn } from "./calendar-timeline-grid";
import { AppointmentCard } from "./appointment-card";
import {
  getCardPosition,
  layoutOverlappingCards,
  toDateKey,
  timeToMinutes,
  type LayoutInput,
} from "@/lib/calendar";
import {
  CALENDAR_DEFAULT_START_HOUR,
  CALENDAR_DEFAULT_END_HOUR,
  CALENDAR_HOUR_HEIGHT_PX,
} from "@/lib/constants/calendar";
import { getShadedRanges } from "./day-calendar-view";
import type {
  CalendarSelection,
  CalendarBlockedTime,
  CalendarBusinessHour,
  SerializedCalendarAppointment,
} from "./types";

interface WeekCalendarViewProps {
  date: Date;
  appointments: SerializedCalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  businessHours: CalendarBusinessHour[];
  selection: CalendarSelection;
  onSelectAppointment: (appointment: SerializedCalendarAppointment) => void;
  onSelectBlockedTime: (blockedTime: CalendarBlockedTime) => void;
  onSlotClick: (day: Date, minutes: number) => void;
}

export function WeekCalendarView({
  date,
  appointments,
  blockedTimes,
  businessHours,
  selection,
  onSelectAppointment,
  onSelectBlockedTime,
  onSlotClick,
}: WeekCalendarViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const columns: TimelineColumn[] = days.map((day) => {
    const dateKey = toDateKey(day);
    const dayAppointments = appointments.filter((a) => toDateKey(a.requestedDate) === dateKey);
    const dayBlocked = blockedTimes.filter((b) => toDateKey(b.date) === dateKey);

    const layoutInputs: LayoutInput[] = [
      ...dayAppointments.map((a) => ({
        id: `appt:${a.id}`,
        startTime: a.requestedTime,
        durationMinutes: a.service.durationMinutes,
      })),
      ...dayBlocked.map((b) => ({
        id: `blocked:${b.id}`,
        startTime: b.startTime,
        durationMinutes: timeToMinutes(b.endTime) - timeToMinutes(b.startTime),
      })),
    ];
    const layout = layoutOverlappingCards(layoutInputs);
    const layoutMap = new Map(layout.map((l) => [l.id, l]));

    const cards = [
      ...dayAppointments.map((a) => {
        const key = `appt:${a.id}`;
        const pos = getCardPosition(a.requestedTime, a.service.durationMinutes, CALENDAR_DEFAULT_START_HOUR, CALENDAR_HOUR_HEIGHT_PX);
        const l = layoutMap.get(key);
        const widthPct = l ? 100 / l.columnCount : 100;
        const leftPct = l ? widthPct * l.column : 0;
        const isSelected = selection?.kind === "appointment" && selection.appointment.id === a.id;
        return (
          <AppointmentCard
            key={key}
            item={a}
            kind="appointment"
            variant="timeline"
            selected={isSelected}
            onClick={() => onSelectAppointment(a)}
            style={{
              top: pos.topPx,
              height: Math.max(pos.heightPx, 20),
              left: `calc(${leftPct}% + 2px)`,
              width: `calc(${widthPct}% - 4px)`,
            }}
          />
        );
      }),
      ...dayBlocked.map((b) => {
        const key = `blocked:${b.id}`;
        const duration = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
        const pos = getCardPosition(b.startTime, duration, CALENDAR_DEFAULT_START_HOUR, CALENDAR_HOUR_HEIGHT_PX);
        const l = layoutMap.get(key);
        const widthPct = l ? 100 / l.columnCount : 100;
        const leftPct = l ? widthPct * l.column : 0;
        const isSelected = selection?.kind === "blocked" && selection.blockedTime.id === b.id;
        return (
          <AppointmentCard
            key={key}
            item={b}
            kind="blocked"
            variant="timeline"
            selected={isSelected}
            onClick={() => onSelectBlockedTime(b)}
            style={{
              top: pos.topPx,
              height: Math.max(pos.heightPx, 20),
              left: `calc(${leftPct}% + 2px)`,
              width: `calc(${widthPct}% - 4px)`,
            }}
          />
        );
      }),
    ];

    return {
      id: dateKey,
      header: (
        <span className={toDateKey(new Date()) === dateKey ? "font-semibold text-brand-pink-foreground" : undefined}>
          {format(day, "EEE d", { locale: tr })}
        </span>
      ),
      content: <>{cards}</>,
      shaded: getShadedRanges(businessHours, day),
      onSlotClick: (minutes: number) => onSlotClick(day, minutes),
    };
  });

  return (
    <CalendarTimelineGrid
      startHour={CALENDAR_DEFAULT_START_HOUR}
      endHour={CALENDAR_DEFAULT_END_HOUR}
      hourHeightPx={CALENDAR_HOUR_HEIGHT_PX}
      columns={columns}
      className="overflow-x-auto"
    />
  );
}
