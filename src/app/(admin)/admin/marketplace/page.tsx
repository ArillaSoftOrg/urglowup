import { getAdminBusinesses } from "@/lib/queries/admin";
import { MarketplaceVisibilityTable } from "@/components/admin/marketplace-visibility-table";

export const metadata = { title: "Admin - Marketplace" };

export default async function AdminMarketplacePage() {
  const businesses = await getAdminBusinesses("ACTIVE_MARKETPLACE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace Visibility</h1>
        <p className="text-muted-foreground">
          Control which Active (Marketplace) businesses appear in marketplace
          listings. Only businesses with this status are shown here.
        </p>
      </div>
      <MarketplaceVisibilityTable businesses={businesses} />
    </div>
  );
}
