"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { sendCustomerMessage } from "@/app/(customer)/account/messages/actions";

interface ThreadViewProps {
  conversationId: string;
  currentUserId: string;
  onBack?: () => void;
}

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface ConversationData {
  id: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  messages: Message[];
}

export function ThreadView({
  conversationId,
  currentUserId,
  onBack,
}: ThreadViewProps) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch(
          `/api/messages/conversations/${conversationId}`
        );
        if (response.ok) {
          const data = await response.json();
          setData(data);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const result = await sendCustomerMessage(conversationId, message);
      if (result.success) {
        setMessage("");
        // Refetch messages
        const response = await fetch(
          `/api/messages/conversations/${conversationId}`
        );
        if (response.ok) {
          const updatedData = await response.json();
          setData(updatedData);
        }
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground">Konuşma bulunamadı</p>
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
        <p className="text-sm font-semibold">{data.business.name}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {data.messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Henüz mesaj yok. İlk mesajı siz gönderin.
          </p>
        ) : (
          data.messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            const senderName = msg.sender.firstName
              ? `${msg.sender.firstName} ${msg.sender.lastName || ""}`
              : msg.sender.email;

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
                  {!isOwn && (
                    <p className="text-xs font-medium opacity-70">{senderName}</p>
                  )}
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-[10px]",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(msg.createdAt), "HH:mm", { locale: tr })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Mesajınızı yazın..."
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            className="min-h-0 resize-none"
          />
          <Button size="icon" type="submit" disabled={sending || !message.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
