"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ConversationList } from "@/components/account/messages/conversation-list";
import { ThreadView } from "@/components/account/messages/thread-view";
import type { ConversationItem, MessageThread } from "@/components/account/messages/message-types";

// No conversations yet — backend to be wired up in a future PR.
const CONVERSATIONS: ConversationItem[] = [];
const THREADS: Record<string, MessageThread> = {};

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const thread = selectedId ? (THREADS[selectedId] ?? null) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mesajlar</h1>
        <Badge variant="secondary" className="text-xs">Yakında</Badge>
      </div>

      <div className="flex overflow-hidden rounded-xl border" style={{ height: "calc(100vh - 14rem)" }}>
        {/* On mobile: show list when no conversation selected, thread otherwise */}
        <div className={selectedId ? "hidden md:flex" : "flex w-full md:w-auto"}>
          <ConversationList
            conversations={CONVERSATIONS}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className={selectedId ? "flex flex-1" : "hidden md:flex flex-1"}>
          <ThreadView
            thread={thread}
            onBack={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  );
}
