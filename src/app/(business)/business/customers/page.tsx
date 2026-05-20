import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CustomerList, type CustomerSummary } from "@/components/business/customer-list";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const { businessId } = await requireBusiness();

  const appointments = await db.appointment.findMany({
    where: { businessId },
    select: {
      customerId: true,
      status: true,
      requestedDate: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { requestedDate: "desc" },
  });

  // Deduplicate: one summary per customer, keeping most recent appointment
  const customerMap = new Map<string, CustomerSummary>();
  for (const appt of appointments) {
    const existing = customerMap.get(appt.customerId);
    if (!existing) {
      customerMap.set(appt.customerId, {
        customerId: appt.customerId,
        firstName: appt.customer.firstName,
        lastName: appt.customer.lastName,
        email: appt.customer.email,
        avatarUrl: appt.customer.avatarUrl,
        appointmentCount: 1,
        lastAppointmentDate: appt.requestedDate,
        lastAppointmentStatus: appt.status,
      });
    } else {
      existing.appointmentCount += 1;
    }
  }

  const customers = Array.from(customerMap.values());

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Customers"
        description="People who have booked appointments with your business."
      />
      <CustomerList customers={customers} />
    </div>
  );
}
