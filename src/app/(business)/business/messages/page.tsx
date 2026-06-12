import { MessageCircle } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { ComingSoon } from "@/components/business/coming-soon";

export const metadata = { title: "Mesajlar" };

export default function BusinessMessagesPage() {
  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Mesajlar"
        description="Müşteri konuşmaları ve randevu iletişimleri burada toplanacak."
      />
      <ComingSoon
        icon={MessageCircle}
        headline="Mesaj merkezi hazırlanıyor"
        description="Yakında müşterilerden gelen konuşmaları, randevu sorularını ve takip mesajlarını tek ekrandan yönetebileceksiniz."
        primaryAction={{ label: "Randevulara Git", href: "/business/appointments" }}
        secondaryAction={{ label: "Müşterileri Gör", href: "/business/customers" }}
      />
    </div>
  );
}
