import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerFavorites } from "@/lib/queries/favorites";
import { BusinessGrid } from "@/components/marketplace/business-grid";

export const metadata = { title: "Favorilerim" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const favorites = await getCustomerFavorites(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Favorilerim</h1>
        <p className="text-muted-foreground">
          Daha sonra için kaydettiğiniz işletmeler.
        </p>
      </div>

      <BusinessGrid
        businesses={favorites}
        emptyMessage="Henüz favori işletmeniz yok. İşletmeleri keşfedin ve beğendiklerinizi kaydedin."
      />
    </div>
  );
}
