import { requireBusiness } from "@/lib/auth";
import { getBusinessAppointments } from "@/lib/queries/appointments";
import { BusinessAppointmentList } from "@/components/business/appointment-list";

export const metadata = { title: "Appointments" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const { businessId } = await requireBusiness();
  const { tab } = await searchParams;

  const appointments = await getBusinessAppointments(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">
          Manage appointment requests from customers.
        </p>
      </div>

      <BusinessAppointmentList
        appointments={appointments}
        defaultTab={tab}
      />
    </div>
  );
}
