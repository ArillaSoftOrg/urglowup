"use client";

import Link from "next/link";
import { CalendarTimelineGrid, type TimelineColumn, type TimelineShadedRange } from "./calendar-timeline-grid";
import { AppointmentCard } from "./appointment-card";
import {
  getCardPosition,
  layoutOverlappingCards,
  toDateKey,
  timeToMinutes,
  type LayoutInput,
} from "@/lib/calendar";
import { getDayOfWeek } from "@/lib/constants/booking";
import {
  CALENDAR_DEFAULT_START_HOUR,
  CALENDAR_DEFAULT_END_HOUR,
  CALENDAR_HOUR_HEIGHT_PX,
  CALENDAR_GENERAL_COLUMN_ID,
} from "@/lib/constants/calendar";
import type {
  CalendarSelection,
  CalendarProfessional,
  CalendarBlockedTime,
  CalendarBusinessHour,
  SerializedCalendarAppointment,
} from "./types";

interface DayCalendarViewProps {
  date: Date;
  appointments: SerializedCalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  professionals: CalendarProfessional[];
  professionalFilter: string | "all";
  businessHours: CalendarBusinessHour[];
  selection: CalendarSelection;
  onSelectAppointment: (appointment: SerializedCalendarAppointment) => void;
  onSelectBlockedTime: (blockedTime: CalendarBlockedTime) => void;
  onSlotClick: (professionalId: string | null, minutes: number) => void;
}

interface ColumnDef {
  id: string;
  label: string;
}

export function getShadedRanges(businessHours: CalendarBusinessHour[], date: Date): TimelineShadedRange[] {
  const hour = businessHours.find((h) => h.dayOfWeek === getDayOfWeek(toDateKey(date)));
  const startMin = CALENDAR_DEFAULT_START_HOUR * 60;
  const endMin = CALENDAR_DEFAULT_END_HOUR * 60;

  if (!hour || !hour.isOpen) {
    return [{ startMinutes: startMin, endMinutes: endMin }];
  }
  if (!hour.openTime || !hour.closeTime) {
    return [];
  }

  const ranges: TimelineShadedRange[] = [];
  const open = timeToMinutes(hour.openTime);
  const close = timeToMinutes(hour.closeTime);
  if (open > startMin) ranges.push({ startMinutes: startMin, endMinutes: Math.min(open, endMin) });
  if (close < endMin) ranges.push({ startMinutes: Math.max(close, startMin), endMinutes: endMin });
  return ranges;
}

export function buildDayColumns(
  professionals: CalendarProfessional[],
  professionalFilter: string | "all",
  hasUnassignedItems: boolean
): ColumnDef[] {
  if (professionals.length === 0) {
    return [{ id: CALENDAR_GENERAL_COLUMN_ID, label: "Genel" }];
  }

  if (professionalFilter === CALENDAR_GENERAL_COLUMN_ID) {
    return [{ id: CALENDAR_GENERAL_COLUMN_ID, label: "Genel" }];
  }

  if (professionalFilter !== "all") {
    const match = professionals.find((p) => p.id === professionalFilter);
    return match ? [{ id: match.id, label: match.displayName }] : [];
  }

  const columns: ColumnDef[] = professionals.map((p) => ({ id: p.id, label: p.displayName }));
  if (hasUnassignedItems) {
    columns.push({ id: CALENDAR_GENERAL_COLUMN_ID, label: "Genel" });
  }
  return columns;
}

export function DayCalendarView({
  date,
  appointments,
  blockedTimes,
  professionals,
  professionalFilter,
  businessHours,
  selection,
  onSelectAppointment,
  onSelectBlockedTime,
  onSlotClick,
}: DayCalendarViewProps) {
  const dateKey = toDateKey(date);
  const dayAppointments = appointments.filter((a) => toDateKey(a.requestedDate) === dateKey);
  const dayBlocked = blockedTimes.filter((b) => toDateKey(b.date) === dateKey);

  const hasUnassigned =
    dayAppointments.some((a) => a.professionalId === null) ||
    dayBlocked.some((b) => b.professionalId === null);

  const columns = buildDayColumns(professionals, professionalFilter, hasUnassigned);
  const shaded = getShadedRanges(businessHours, date);

  if (professionals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border/50 bg-muted/20 py-12 px-6 text-center">
          <div className="space-y-3 max-w-md">
            <h3 className="text-base font-semibold text-foreground">Takvimi kullanmaya başlamak için personel ekleyin</h3>
            <p className="text-sm text-muted-foreground">
              Personel ekledikten sonra, her biri için ayrı takvim sütunlarında randevuları yönetebilirsiniz.
            </p>
            <Link
              href="/business/team"
              className="inline-flex items-center justify-center rounded-md bg-brand-pink text-brand-pink-foreground px-4 py-2 text-sm font-medium hover:bg-brand-pink/90 transition-colors"
            >
              Personel ekle
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card">
          {renderGrid()}
        </div>
      </div>
    );
  }

  return renderGrid();

  function renderGrid() {
    const timelineColumns: TimelineColumn[] = columns.map((col) => {
      const colAppointments = dayAppointments.filter((a) =>
        col.id === CALENDAR_GENERAL_COLUMN_ID ? a.professionalId === null : a.professionalId === col.id
      );
      const colBlocked = dayBlocked.filter((b) =>
        col.id === CALENDAR_GENERAL_COLUMN_ID ? b.professionalId === null : b.professionalId === col.id
      );

      const layoutInputs: LayoutInput[] = [
        ...colAppointments.map((a) => ({
          id: `appt:${a.id}`,
          startTime: a.requestedTime,
          durationMinutes: a.service.durationMinutes,
        })),
        ...colBlocked.map((b) => ({
          id: `blocked:${b.id}`,
          startTime: b.startTime,
          durationMinutes: timeToMinutes(b.endTime) - timeToMinutes(b.startTime),
        })),
      ];
      const layout = layoutOverlappingCards(layoutInputs);
      const layoutMap = new Map(layout.map((l) => [l.id, l]));

      const cards = [
        ...colAppointments.map((a) => {
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
        ...colBlocked.map((b) => {
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
        id: col.id,
        header: col.label,
        content: <>{cards}</>,
        shaded,
        onSlotClick: (minutes: number) => onSlotClick(col.id === CALENDAR_GENERAL_COLUMN_ID ? null : col.id, minutes),
      };
    });

    const hasAnyItems = dayAppointments.length > 0 || dayBlocked.length > 0;

    return (
      <div className="relative">
        <CalendarTimelineGrid
          startHour={CALENDAR_DEFAULT_START_HOUR}
          endHour={CALENDAR_DEFAULT_END_HOUR}
          hourHeightPx={CALENDAR_HOUR_HEIGHT_PX}
          columns={timelineColumns}
          className="overflow-x-auto"
        />
        {!hasAnyItems && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-transparent to-muted/5 pointer-events-none">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Bu gün için randevu yok</p>
            </div>
          </div>
        )}
      </div>
    );
  }
}
