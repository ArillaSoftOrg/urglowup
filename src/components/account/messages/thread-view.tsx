"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { sendCustomerMessage } from "@/app/(customer)/account/messages/actions";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface ThreadViewProps {
  conversationId: string;
  currentUserId: string;
  businessName?: string;
  onBack?: () => void;
}

export function ThreadView({
  conversationId,
  currentUserId,
  businessName = "Conversation",
  onBack,
}: ThreadViewProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>();

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
    pollIntervalMs: 2000, // Poll every 2 seconds
  });

  // Use typing indicator hook
  const { isOtherTyping, setIsTyping } = useTypingIndicator({
    conversationId,
    enabled: true,
    pollIntervalMs: 500,
  });

  // Auto-scroll to bottom when messages change or typing indicator shows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages, isOtherTyping]);

  // Detect user typing
  useEffect(() => {
    return () => {
      // Clean up: user stopped typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    const messageContent = message;
    setMessage(""); // Clear input immediately for better UX
    setSendError(null);

    // Create optimistic message
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

    // Show immediately (optimistic update)
    addOptimisticMessage(optimisticMessage);

    setSending(true);
    try {
      const result = await sendCustomerMessage(conversationId, messageContent);
      if (result.success) {
        // Refetch to get the real message (with server timestamp, etc.)
        await refetch();
      } else {
        setSendError(result.error || "Failed to send message");
        // Re-add message to allow retry
        setMessage(messageContent);
      }
    } catch (err) {
      console.error("[thread-view] Send failed:", err);
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
        <p className="text-sm font-semibold">{businessName}</p>
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
            Henüz mesaj yok. İlk mesajı siz gönderin.
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
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    <span>
                      {format(new Date(msg.createdAt), "HH:mm", { locale: tr })}
                      {isOptimistic && " (gönderiliyor...)"}
                    </span>
                    {isOwn && msg.isRead && <span>✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground italic">
              İşletme yazıyor...
            </p>
          </div>
        )}
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
            placeholder="Mesajınızı yazın..."
            rows={2}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);

              // Send typing indicator
              const isTyping = e.target.value.length > 0;
              setIsUserTyping(isTyping);
              void setIsTyping(isTyping);

              // Reset typing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              if (isTyping) {
                typingTimeoutRef.current = setTimeout(() => {
                  setIsUserTyping(false);
                  void setIsTyping(false);
                }, 3000);
              }
            }}
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
