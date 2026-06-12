"use client";

import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CalendarPlus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABELS } from "@/lib/constants/booking";
import { CALENDAR_GENERAL_COLUMN_ID } from "@/lib/constants/calendar";
import type { CalendarView, CalendarProfessional } from "./types";
import type { AppointmentStatus } from "@/generated/prisma/enums";

const ALL_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "NO_SHOW",
  "REJECTED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_BUSINESS",
];

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Gün",
  week: "Hafta",
  month: "Ay",
  staff: "Personel",
  list: "Liste",
};

interface CalendarToolbarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  statusFilter: AppointmentStatus | "all";
  onStatusFilterChange: (status: AppointmentStatus | "all") => void;
  professionalFilter: string | "all";
  onProfessionalFilterChange: (id: string | "all") => void;
  professionals: CalendarProfessional[];
  onNewAppointment: () => void;
  onNewBlockedTime: () => void;
  isMobile: boolean;
}

function getDateLabel(view: CalendarView, date: Date): string {
  switch (view) {
    case "week": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: tr })} - ${format(end, "d MMM yyyy", { locale: tr })}`;
    }
    case "month":
      return format(date, "MMMM yyyy", { locale: tr });
    case "list":
      return `${format(date, "d MMMM yyyy", { locale: tr })} ve sonrası`;
    default:
      return format(date, "d MMMM yyyy, EEEE", { locale: tr });
  }
}

function shiftDate(view: CalendarView, date: Date, direction: 1 | -1): Date {
  switch (view) {
    case "week":
      return addWeeks(date, direction);
    case "month":
      return addMonths(date, direction);
    default:
      return addDays(date, direction);
  }
}

function getStatusFilterLabel(statusFilter: AppointmentStatus | "all"): string {
  return statusFilter === "all" ? "Tümü" : STATUS_LABELS[statusFilter];
}

function getProfessionalFilterLabel(
  professionalFilter: string | "all",
  professionals: CalendarProfessional[]
): string {
  if (professionalFilter === "all") return "Tümü";
  if (professionalFilter === CALENDAR_GENERAL_COLUMN_ID) return "Personel atanmadı";
  return professionals.find((pro) => pro.id === professionalFilter)?.displayName ?? "Personel";
}

export function CalendarToolbar({
  view,
  onViewChange,
  selectedDate,
  onDateChange,
  statusFilter,
  onStatusFilterChange,
  professionalFilter,
  onProfessionalFilterChange,
  professionals,
  onNewAppointment,
  onNewBlockedTime,
  isMobile,
}: CalendarToolbarProps) {
  const statusFilterLabel = getStatusFilterLabel(statusFilter);
  const professionalFilterLabel = getProfessionalFilterLabel(professionalFilter, professionals);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
          Bugün
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onDateChange(shiftDate(view, selectedDate, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onDateChange(shiftDate(view, selectedDate, 1))}>
          <ChevronRight className="size-4" />
        </Button>
        <p className="text-sm font-medium capitalize">{getDateLabel(view, selectedDate)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as AppointmentStatus | "all")}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Durum">{statusFilterLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {professionals.length > 0 && view !== "staff" && (
          <Select value={professionalFilter} onValueChange={(v) => onProfessionalFilterChange(v as string)}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Personel">{professionalFilterLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value={CALENDAR_GENERAL_COLUMN_ID}>Personel atanmadı</SelectItem>
              {professionals.map((pro) => (
                <SelectItem key={pro.id} value={pro.id}>
                  {pro.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!isMobile && (
          <Tabs value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
            <TabsList>
              {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
                <TabsTrigger key={v} value={v}>
                  {VIEW_LABELS[v]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" />}>
            <Plus className="size-4" />
            Yeni
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewAppointment}>
              <CalendarPlus className="size-4" />
              Yeni randevu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewBlockedTime}>
              <Ban className="size-4" />
              Zaman blokla
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
