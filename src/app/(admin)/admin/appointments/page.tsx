import { getAdminAppointments } from "@/lib/queries/admin";
import { AppointmentTable } from "@/components/admin/appointment-table";

export const metadata = { title: "Admin - Appointments" };

export default async function AdminAppointmentsPage() {
  const appointments = await getAdminAppointments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">
          View all appointment requests across the platform.
        </p>
      </div>
      <AppointmentTable appointments={appointments} />
    </div>
  );
}
