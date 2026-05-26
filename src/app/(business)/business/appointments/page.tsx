import { requireBusiness } from "@/lib/auth";
import { getBusinessAppointments } from "@/lib/queries/appointments";
import { BusinessAppointmentList } from "@/components/business/appointment-list";
import { BusinessPageHeader } from "@/components/business/business-page-header";

export const metadata = { title: "Randevular" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const { businessId } = await requireBusiness();
  const { tab } = await searchParams;

  const appointments = await getBusinessAppointments(businessId);

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Randevular"
        description="Müşterilerden gelen randevu taleplerini yönetin."
      />
      <BusinessAppointmentList appointments={appointments} defaultTab={tab} />
    </div>
  );
}
