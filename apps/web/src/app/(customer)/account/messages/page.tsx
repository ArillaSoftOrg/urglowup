import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversationsForCustomer } from "@/lib/queries/messages";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";
import { MessagesClientWrapper } from "@/components/account/messages/messages-client-wrapper";

export const metadata = { title: "Mesajlar" };

interface MessagesPageProps {
  searchParams: Promise<{ conversation?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const { conversation: initialSelectedId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const conversations = await getConversationsForCustomer(user.id);

  if (conversations.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Mesajlar</h1>
        </div>

        <EmptyState
          icon={MessageSquare}
          headline="Henüz konuşma yok"
          description="İşletmelerle mesajlaşmaya başlamak için bir randevuyu tamamlayın."
          surface="cream"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mesajlar</h1>
        <Badge variant="secondary" className="text-xs">
          {conversations.length}
        </Badge>
      </div>

      <MessagesClientWrapper
        conversations={conversations}
        currentUserId={user.id}
        initialSelectedId={initialSelectedId}
      />
    </div>
  );
}
