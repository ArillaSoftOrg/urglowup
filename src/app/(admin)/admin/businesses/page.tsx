import Link from "next/link";
import { getAdminBusinesses } from "@/lib/queries/admin";
import { BusinessTable } from "@/components/admin/business-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = { title: "Admin - Businesses" };

export default async function AdminBusinessesPage() {
  const businesses = await getAdminBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Businesses</h1>
          <p className="text-muted-foreground">
            Manage business registrations and status.
          </p>
        </div>
        <Button size="sm" render={<Link href="/admin/businesses/create" />}>
          <Plus className="size-4 mr-1" />
          Yeni İşletme
        </Button>
      </div>

      <BusinessTable businesses={businesses} />
    </div>
  );
}
