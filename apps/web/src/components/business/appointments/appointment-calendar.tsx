"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CalendarToolbar } from "./calendar-toolbar";
import { DayCalendarView } from "./day-calendar-view";
import { WeekCalendarView } from "./week-calendar-view";
import { MonthCalendarView } from "./month-calendar-view";
import { StaffCalendarView } from "./staff-calendar-view";
import { ListCalendarView } from "./list-calendar-view";
import { AppointmentDetailPanel } from "./appointment-detail-panel";
import { AppointmentForm } from "./appointment-form";
import { BlockedTimeForm } from "./blocked-time-form";
import { toDateKey, minutesToTime } from "@/lib/calendar";
import {
  CALENDAR_FETCH_MONTHS_BEFORE,
  CALENDAR_FETCH_MONTHS_AFTER,
  CALENDAR_GENERAL_COLUMN_ID,
} from "@/lib/constants/calendar";
import { getCalendarDataForRange } from "@/app/(business)/business/appointments/actions";
import type {
  CalendarView,
  CalendarSelection,
  CalendarFormPrefill,
  CalendarProfessional,
  CalendarBlockedTime,
  CalendarBusinessHour,
  CalendarCustomerSummary,
  SerializedCalendarAppointment,
  SerializedCalendarService,
} from "./types";
import type { AppointmentStatus } from "@/generated/prisma/enums";

interface AppointmentCalendarProps {
  initialAppointments: SerializedCalendarAppointment[];
  initialBlockedTimes: CalendarBlockedTime[];
  professionals: CalendarProfessional[];
  services: SerializedCalendarService[];
  businessHours: CalendarBusinessHour[];
  customers: CalendarCustomerSummary[];
  initialRangeStart: string;
  initialRangeEnd: string;
  initialView?: CalendarView;
  initialStatusFilter?: AppointmentStatus | "all";
}

interface AppointmentFormState {
  open: boolean;
  mode: "create" | "edit";
  prefill?: CalendarFormPrefill;
  appointment?: SerializedCalendarAppointment;
}

interface BlockedTimeFormState {
  open: boolean;
  prefill?: CalendarFormPrefill;
}

export function AppointmentCalendar({
  initialAppointments,
  initialBlockedTimes,
  professionals,
  services,
  businessHours,
  customers,
  initialRangeStart,
  initialRangeEnd,
  initialView,
  initialStatusFilter,
}: AppointmentCalendarProps) {
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();

  const [appointments, setAppointments] = useState(initialAppointments);
  const [blockedTimes, setBlockedTimes] = useState(initialBlockedTimes);
  const [rangeStart, setRangeStart] = useState(initialRangeStart);
  const [rangeEnd, setRangeEnd] = useState(initialRangeEnd);

  const [view, setView] = useState<CalendarView>(initialView ?? "week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    initialStatusFilter ?? "all"
  );
  const [professionalFilter, setProfessionalFilter] = useState<string | "all">("all");
  const [selection, setSelection] = useState<CalendarSelection>(null);

  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>({
    open: false,
    mode: "create",
  });
  const [blockedTimeForm, setBlockedTimeForm] = useState<BlockedTimeFormState>({ open: false });

  const refreshRange = useCallback((start: string, end: string) => {
    startTransition(async () => {
      const data = await getCalendarDataForRange(start, end);
      setAppointments(data.appointments);
      setBlockedTimes(data.blockedTimes);
      setRangeStart(start);
      setRangeEnd(end);
    });
  }, [startTransition]);

  useEffect(() => {
    const dateKey = toDateKey(selectedDate);
    if (dateKey >= rangeStart && dateKey <= rangeEnd) return;

    const newStart = toDateKey(startOfMonth(subMonths(selectedDate, CALENDAR_FETCH_MONTHS_BEFORE)));
    const newEnd = toDateKey(endOfMonth(addMonths(selectedDate, CALENDAR_FETCH_MONTHS_AFTER)));
    refreshRange(newStart, newEnd);
  }, [selectedDate, rangeStart, rangeEnd, refreshRange]);

  const effectiveView: CalendarView = isMobile ? "list" : view;

  const statusFilteredAppointments = appointments.filter(
    (a) => statusFilter === "all" || a.status === statusFilter
  );

  const professionalFilteredAppointments = (() => {
    if (professionalFilter === "all") return statusFilteredAppointments;
    if (professionalFilter === CALENDAR_GENERAL_COLUMN_ID) {
      return statusFilteredAppointments.filter((a) => a.professionalId === null);
    }
    return statusFilteredAppointments.filter((a) => a.professionalId === professionalFilter);
  })();

  const professionalFilteredBlockedTimes = (() => {
    if (professionalFilter === "all") return blockedTimes;
    if (professionalFilter === CALENDAR_GENERAL_COLUMN_ID) {
      return blockedTimes.filter((b) => b.professionalId === null);
    }
    return blockedTimes.filter(
      (b) => b.professionalId === professionalFilter || b.professionalId === null
    );
  })();

  function handleSelectAppointment(appointment: SerializedCalendarAppointment) {
    setSelection({ kind: "appointment", appointment });
  }

  function handleSelectBlockedTime(blockedTime: CalendarBlockedTime) {
    setSelection({ kind: "blocked", blockedTime });
  }

  function handleCloseDetail() {
    setSelection(null);
  }

  function handleAppointmentStatusChange(appointmentId: string, status: AppointmentStatus) {
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status } : a)));
    setSelection((prev) =>
      prev?.kind === "appointment" && prev.appointment.id === appointmentId
        ? { kind: "appointment", appointment: { ...prev.appointment, status } }
        : prev
    );
  }

  function handleAppointmentNoteChange(appointmentId: string, note: string | null) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, businessNote: note } : a))
    );
    setSelection((prev) =>
      prev?.kind === "appointment" && prev.appointment.id === appointmentId
        ? { kind: "appointment", appointment: { ...prev.appointment, businessNote: note } }
        : prev
    );
  }

  function handleBlockedTimeDeleted(blockedTimeId: string) {
    setBlockedTimes((prev) => prev.filter((b) => b.id !== blockedTimeId));
    setSelection((prev) =>
      prev?.kind === "blocked" && prev.blockedTime.id === blockedTimeId ? null : prev
    );
  }

  function openCreateAppointment(prefill?: CalendarFormPrefill) {
    setAppointmentForm({ open: true, mode: "create", prefill });
  }

  function openEditAppointment(appointment: SerializedCalendarAppointment) {
    setAppointmentForm({ open: true, mode: "edit", appointment });
  }

  function openCreateBlockedTime(prefill?: CalendarFormPrefill) {
    setBlockedTimeForm({ open: true, prefill });
  }

  function handleFormSaved() {
    refreshRange(rangeStart, rangeEnd);
  }

  function resolveProfessionalFilterId(): string | null {
    if (professionalFilter === "all" || professionalFilter === CALENDAR_GENERAL_COLUMN_ID) {
      return null;
    }
    return professionalFilter;
  }

  function renderView() {
    switch (effectiveView) {
      case "day":
        return (
          <DayCalendarView
            date={selectedDate}
            appointments={statusFilteredAppointments}
            blockedTimes={blockedTimes}
            professionals={professionals}
            professionalFilter={professionalFilter}
            businessHours={businessHours}
            selection={selection}
            onSelectAppointment={handleSelectAppointment}
            onSelectBlockedTime={handleSelectBlockedTime}
            onSlotClick={(professionalId, minutes) =>
              openCreateAppointment({
                date: toDateKey(selectedDate),
                startTime: minutesToTime(minutes),
                professionalId,
              })
            }
          />
        );
      case "week":
        return (
          <WeekCalendarView
            date={selectedDate}
            appointments={professionalFilteredAppointments}
            blockedTimes={professionalFilteredBlockedTimes}
            businessHours={businessHours}
            selection={selection}
            onSelectAppointment={handleSelectAppointment}
            onSelectBlockedTime={handleSelectBlockedTime}
            onSlotClick={(day, minutes) =>
              openCreateAppointment({
                date: toDateKey(day),
                startTime: minutesToTime(minutes),
                professionalId: resolveProfessionalFilterId(),
              })
            }
          />
        );
      case "month":
        return (
          <MonthCalendarView
            date={selectedDate}
            appointments={professionalFilteredAppointments}
            blockedTimes={professionalFilteredBlockedTimes}
            selection={selection}
            onSelectAppointment={handleSelectAppointment}
            onSelectBlockedTime={handleSelectBlockedTime}
            onDrillDown={(date) => {
              setSelectedDate(date);
              setView("day");
            }}
          />
        );
      case "staff":
        return (
          <StaffCalendarView
            date={selectedDate}
            appointments={statusFilteredAppointments}
            blockedTimes={blockedTimes}
            professionals={professionals}
            businessHours={businessHours}
            selection={selection}
            onSelectAppointment={handleSelectAppointment}
            onSelectBlockedTime={handleSelectBlockedTime}
            onSlotClick={(professionalId, minutes) =>
              openCreateAppointment({
                date: toDateKey(selectedDate),
                startTime: minutesToTime(minutes),
                professionalId,
              })
            }
          />
        );
      case "list":
        return (
          <ListCalendarView
            selectedDate={selectedDate}
            appointments={professionalFilteredAppointments}
            blockedTimes={professionalFilteredBlockedTimes}
            selection={selection}
            onSelectAppointment={handleSelectAppointment}
            onSelectBlockedTime={handleSelectBlockedTime}
          />
        );
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        professionalFilter={professionalFilter}
        onProfessionalFilterChange={setProfessionalFilter}
        professionals={professionals}
        onNewAppointment={() => openCreateAppointment({ date: toDateKey(selectedDate) })}
        onNewBlockedTime={() => openCreateBlockedTime({ date: toDateKey(selectedDate) })}
        isMobile={isMobile}
      />

      <div className="flex flex-1 gap-4">
        <div className="min-w-0 flex-1">{renderView()}</div>

        <div className="hidden w-80 shrink-0 self-start rounded-lg border border-border/50 bg-card lg:block">
          <AppointmentDetailPanel
            selection={selection}
            onClose={handleCloseDetail}
            onEdit={openEditAppointment}
            onAppointmentStatusChange={handleAppointmentStatusChange}
            onAppointmentNoteChange={handleAppointmentNoteChange}
            onBlockedTimeDeleted={handleBlockedTimeDeleted}
          />
        </div>
      </div>

      <Sheet
        open={isMobile && selection !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseDetail();
        }}
      >
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <AppointmentDetailPanel
            selection={selection}
            onClose={handleCloseDetail}
            onEdit={openEditAppointment}
            onAppointmentStatusChange={handleAppointmentStatusChange}
            onAppointmentNoteChange={handleAppointmentNoteChange}
            onBlockedTimeDeleted={handleBlockedTimeDeleted}
          />
        </SheetContent>
      </Sheet>

      <AppointmentForm
        open={appointmentForm.open}
        onOpenChange={(open) => setAppointmentForm((prev) => ({ ...prev, open }))}
        mode={appointmentForm.mode}
        prefill={appointmentForm.prefill}
        appointment={appointmentForm.appointment}
        customers={customers}
        services={services}
        professionals={professionals}
        appointments={appointments}
        blockedTimes={blockedTimes}
        businessHours={businessHours}
        onSaved={handleFormSaved}
      />

      <BlockedTimeForm
        open={blockedTimeForm.open}
        onOpenChange={(open) => setBlockedTimeForm((prev) => ({ ...prev, open }))}
        prefill={blockedTimeForm.prefill}
        professionals={professionals}
        onSaved={handleFormSaved}
      />
    </div>
  );
}
