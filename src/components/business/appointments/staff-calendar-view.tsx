"use client";

import { DayCalendarView } from "./day-calendar-view";
import type {
  CalendarSelection,
  CalendarProfessional,
  CalendarBlockedTime,
  CalendarBusinessHour,
  SerializedCalendarAppointment,
} from "./types";

interface StaffCalendarViewProps {
  date: Date;
  appointments: SerializedCalendarAppointment[];
  blockedTimes: CalendarBlockedTime[];
  professionals: CalendarProfessional[];
  businessHours: CalendarBusinessHour[];
  selection: CalendarSelection;
  onSelectAppointment: (appointment: SerializedCalendarAppointment) => void;
  onSelectBlockedTime: (blockedTime: CalendarBlockedTime) => void;
  onSlotClick: (professionalId: string | null, minutes: number) => void;
}

/**
 * Side-by-side staff columns for a single day — always shows every active
 * professional regardless of the toolbar's professional filter, so the
 * business can compare everyone's schedule at a glance.
 */
export function StaffCalendarView(props: StaffCalendarViewProps) {
  return <DayCalendarView {...props} professionalFilter="all" />;
}
