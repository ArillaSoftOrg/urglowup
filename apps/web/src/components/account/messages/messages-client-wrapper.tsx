"use client";

import { useState } from "react";
import type { CustomerConversation } from "@/lib/queries/messages";
import { ConversationList } from "./conversation-list";
import { ThreadView } from "./thread-view";

interface MessagesClientWrapperProps {
  conversations: CustomerConversation[];
  currentUserId: string;
  initialSelectedId?: string | null;
}

export function MessagesClientWrapper({
  conversations,
  currentUserId,
  initialSelectedId = null,
}: MessagesClientWrapperProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  return (
    <div
      className="flex overflow-hidden rounded-xl border"
      style={{ height: "calc(100vh - 14rem)" }}
    >
      {/* On mobile: show list when no conversation selected, thread otherwise */}
      <div
        className={selectedId ? "hidden md:flex" : "flex w-full md:w-auto"}
      >
        <ConversationList
          conversations={conversations.map((conv) => ({
            id: conv.id,
            businessName: conv.business.name,
            businessLogoUrl: conv.business.logoUrl,
            lastMessage: conv.messages[0]?.content || "No messages yet",
            lastMessageAt: conv.messages[0]?.createdAt || conv.createdAt,
            unreadCount: conv._count.messages,
          }))}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <div
        className={selectedId ? "flex flex-1" : "hidden md:flex flex-1"}
      >
        {selectedId && conversations.find((c) => c.id === selectedId) ? (
          <ThreadView
            conversationId={selectedId}
            currentUserId={currentUserId}
            businessName={conversations.find((c) => c.id === selectedId)?.business.name}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Konuşma seçin
          </div>
        )}
      </div>
    </div>
  );
}
