import { requireBusiness } from "@/lib/auth";
import { getConversationsForBusiness } from "@/lib/queries/messages";
import { BusinessMessageCenter } from "@/components/business/messages/message-center";

export const metadata = { title: "Mesajlar" };

export default async function BusinessMessagesPage() {
  const { user, businessId } = await requireBusiness();
  const conversations = await getConversationsForBusiness(businessId);

  return (
    <div className="-mx-4 -mt-7 -mb-7 h-[calc(100vh-9rem)] overflow-hidden md:-mx-8 md:h-[calc(100vh-4rem)] lg:-mx-10">
      <BusinessMessageCenter
        conversations={conversations}
        businessUserId={user.id}
      />
    </div>
  );
}
