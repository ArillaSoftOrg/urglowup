import { Store } from "lucide-react";
import { BusinessCard } from "./business-card";
import type { MarketplaceBusiness } from "@/lib/queries/marketplace";

interface BusinessGridProps {
  businesses: MarketplaceBusiness[];
  emptyMessage?: string;
}

export function BusinessGrid({
  businesses,
  emptyMessage = "Henüz listelenmiş işletme yok.",
}: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Store className="size-10 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}
