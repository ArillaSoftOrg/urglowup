import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerAppointments } from "@/lib/queries/appointments";
import { CustomerAppointmentList } from "@/components/account/appointment-list";

export const metadata = { title: "My Appointments" };

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const appointments = await getCustomerAppointments(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground">
          Track and manage your appointment requests.
        </p>
      </div>

      <CustomerAppointmentList appointments={appointments} />
    </div>
  );
}
