import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface EmptyFilterStateProps {
  clearHref: string;
}

export function EmptyFilterState({ clearHref }: EmptyFilterStateProps) {
  return (
    <EmptyState
      icon={SearchX}
      headline="Filtrelerinize uygun uzman bulunamadı"
      description="Aramanızı değiştirmeyi veya bazı filtreleri kaldırmayı deneyin."
      action={{ label: "Tüm filtreleri temizle", href: clearHref, variant: "outline" }}
      surface="cream"
    />
  );
}
