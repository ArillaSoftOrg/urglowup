"use client";

import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { MessageThread } from "./message-types";

interface ThreadViewProps {
  thread: MessageThread | null;
  currentUserId?: string;
  onBack?: () => void;
}

export function ThreadView({ thread, currentUserId, onBack }: ThreadViewProps) {
  if (!thread) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
        <p className="text-sm text-muted-foreground">
          Bir konuşma seçin
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <p className="text-sm font-semibold">{thread.businessName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thread.messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Henüz mesaj yok. İlk mesajı siz gönderin.
          </p>
        ) : (
          thread.messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-[10px]",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {format(msg.sentAt, "HH:mm", { locale: tr })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Mesajınızı yazın..."
            rows={2}
            disabled
            className="min-h-0 resize-none"
          />
          <Button size="icon" disabled>
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Mesajlaşma yakında aktif olacak.
        </p>
      </div>
    </div>
  );
}
