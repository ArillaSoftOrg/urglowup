import { Store } from "lucide-react";
import { BusinessCard } from "./business-card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <EmptyState
        icon={Store}
        headline={emptyMessage}
        surface="cream"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}
