"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { sendBusinessMessage } from "@/app/(business)/business/messages/actions";
import { useConversationMessages } from "@/hooks/useConversationMessages";

interface ThreadViewProps {
  conversationId: string;
  currentUserId: string;
  customerName?: string;
  onBack?: () => void;
}

export function ThreadView({
  conversationId,
  currentUserId,
  customerName = "Customer",
  onBack,
}: ThreadViewProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use polling hook for real-time messages
  const {
    data,
    loading,
    error,
    refetch,
    addOptimisticMessage,
  } = useConversationMessages({
    conversationId,
    enabled: true,
    pollIntervalMs: 2000,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    const messageContent = message;
    setMessage("");
    setSendError(null);

    // Optimistic update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      content: messageContent,
      isRead: true,
      createdAt: new Date(),
      senderId: currentUserId,
      sender: {
        id: currentUserId,
        firstName: null,
        lastName: null,
        email: "",
      },
    };

    addOptimisticMessage(optimisticMessage);

    setSending(true);
    try {
      const result = await sendBusinessMessage(conversationId, messageContent);
      if (result.success) {
        await refetch();
      } else {
        setSendError(result.error || "Failed to send message");
        setMessage(messageContent);
      }
    } catch (err) {
      console.error("[business-thread-view] Send failed:", err);
      setSendError("Network error. Please try again.");
      setMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void sendMessage();
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
        <p className="text-sm font-semibold">{customerName}</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-2">
          <p className="text-xs text-yellow-800">
            ⚠️ Messages may not be up to date. Trying to reconnect...
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {data.messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Henüz mesaj yok. Cevap vererek başlayın.
          </p>
        ) : (
          data.messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            const isOptimistic = msg.id.startsWith("temp-");
            const senderName = msg.sender.firstName
              ? `${msg.sender.firstName} ${msg.sender.lastName || ""}`
              : msg.sender.email || "Bilinmeyen";

            return (
              <div
                key={msg.id}
                className={cn("flex", isOwn ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                    isOptimistic && "opacity-60"
                  )}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium opacity-70">
                      {senderName}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-[10px]",
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(new Date(msg.createdAt), "HH:mm", { locale: tr })}
                    {isOptimistic && " (gönderiliyor...)"}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-3">
        {sendError && (
          <p className="mb-2 text-xs text-red-600">
            {sendError}
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Yanıt yazın..."
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            className="min-h-0 resize-none"
          />
          <Button
            size="icon"
            type="submit"
            disabled={sending || !message.trim()}
            title="Ctrl+Enter to send"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
