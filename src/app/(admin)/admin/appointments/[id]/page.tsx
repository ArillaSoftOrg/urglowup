import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdminMfa } from "@/lib/auth";
import { getAdminAppointmentDetail } from "@/lib/queries/admin";
import { AppointmentDetail } from "@/components/admin/appointment-detail";

export const metadata = { title: "Admin - Appointment Detail" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAppointmentDetailPage({ params }: Props) {
  const { id } = await params;

  const [data] = await Promise.all([
    getAdminAppointmentDetail(id),
    requireAdminMfa(),
  ]);

  if (!data) notFound();

  const { appointment } = data;
  const customerName =
    [appointment.customer.firstName, appointment.customer.lastName]
      .filter(Boolean)
      .join(" ") || appointment.customer.email;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/appointments"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="size-4" />
          Back to Appointments
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Appointment Detail</h1>
        <p className="text-muted-foreground">
          {customerName} · {appointment.business.name} · {appointment.service.name}
        </p>
      </div>

      <AppointmentDetail data={data} />
    </div>
  );
}
