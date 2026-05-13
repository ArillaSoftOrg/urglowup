import { getAdminBusinesses } from "@/lib/queries/admin";
import { BusinessTable } from "@/components/admin/business-table";

export const metadata = { title: "Admin - Businesses" };

export default async function AdminBusinessesPage() {
  const businesses = await getAdminBusinesses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Businesses</h1>
        <p className="text-muted-foreground">
          Manage business registrations and status.
        </p>
      </div>

      <BusinessTable businesses={businesses} />
    </div>
  );
}
