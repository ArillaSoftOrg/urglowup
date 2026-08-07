"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { ConversationItem } from "./message-types";

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-3 p-8 text-center md:w-72 md:border-r">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Henüz mesajınız yok</p>
          <p className="text-xs text-muted-foreground">
            İşletmelerle iletişime geçerek başlayın.
          </p>
        </div>
        <Link
          href="/explore"
          className="text-xs font-medium text-primary hover:underline"
        >
          İşletmeleri keşfet
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full shrink-0 overflow-y-auto md:w-72 md:border-r">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
            selectedId === conv.id && "bg-accent"
          )}
        >
          <Avatar className="size-10 shrink-0">
            {conv.businessLogoUrl && (
              <AvatarImage src={conv.businessLogoUrl} alt={conv.businessName} />
            )}
            <AvatarFallback className="text-xs">
              {conv.businessName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{conv.businessName}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(conv.lastMessageAt, {
                  addSuffix: false,
                  locale: tr,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs text-muted-foreground">
                {conv.lastMessage}
              </p>
              {conv.unreadCount > 0 && (
                <Badge className="shrink-0 text-xs" variant="default">
                  {conv.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
