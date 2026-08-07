import { requireBusiness } from "@/lib/auth";
import {
  getBusinessCalendarData,
  getBusinessCustomerSummaries,
} from "@/lib/queries/appointments";
import { AppointmentCalendar } from "@/components/business/appointments/appointment-calendar";
import {
  serializeCalendarAppointment,
  serializeCalendarService,
} from "@/components/business/appointments/types";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { toDateKey } from "@/lib/calendar";
import type { CalendarView } from "@/components/business/appointments/types";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Randevular" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const { businessId } = await requireBusiness();
  const { tab } = await searchParams;

  const [calendarData, customers] = await Promise.all([
    getBusinessCalendarData(businessId),
    getBusinessCustomerSummaries(businessId),
  ]);

  let initialView: CalendarView | undefined;
  let initialStatusFilter: AppointmentStatus | "all" | undefined;
  if (tab === "pending") {
    initialView = "list";
    initialStatusFilter = "PENDING";
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <BusinessPageHeader
        title="Randevular"
        description="Müşterilerden gelen randevu taleplerini ve takvimi yönetin."
      />
      <AppointmentCalendar
        initialAppointments={calendarData.appointments.map(serializeCalendarAppointment)}
        initialBlockedTimes={calendarData.blockedTimes}
        professionals={calendarData.professionals}
        services={calendarData.services.map(serializeCalendarService)}
        businessHours={calendarData.businessHours}
        customers={customers}
        initialRangeStart={toDateKey(calendarData.rangeStart)}
        initialRangeEnd={toDateKey(calendarData.rangeEnd)}
        initialView={initialView}
        initialStatusFilter={initialStatusFilter}
      />
    </div>
  );
}
