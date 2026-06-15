import { BusinessMessageCenter } from "@/components/business/messages/message-center";

export const metadata = { title: "Mesajlar" };

export default function BusinessMessagesPage() {
  return (
    <div className="-mx-4 -mt-7 -mb-7 h-[calc(100vh-9rem)] overflow-hidden md:-mx-8 md:h-[calc(100vh-4rem)] lg:-mx-10">
      <BusinessMessageCenter />
    </div>
  );
}
