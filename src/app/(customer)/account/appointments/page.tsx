import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerAppointments } from "@/lib/queries/appointments";
import { CustomerAppointmentList } from "@/components/account/appointment-list";

export const metadata = { title: "Randevularım" };

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const appointments = await getCustomerAppointments(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Randevularım</h1>
        <p className="text-muted-foreground">
          Randevu isteklerinizi takip edin ve yönetin.
        </p>
      </div>

      <CustomerAppointmentList appointments={appointments} />
    </div>
  );
}
