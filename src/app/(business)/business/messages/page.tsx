import { BusinessPageHeader } from "@/components/business/business-page-header";
import { BusinessMessageCenter } from "@/components/business/messages/message-center";

export const metadata = { title: "Mesajlar" };

export default function BusinessMessagesPage() {
  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Mesajlar"
        description="Müşteri konuşmaları, randevu soruları ve takip mesajları tek ekranda."
      />
      <BusinessMessageCenter />
    </div>
  );
}
