import { useEffect, useState, useCallback, useRef } from "react";
import type { ConversationWithMessages } from "@/lib/queries/messages";

type ConversationData = NonNullable<ConversationWithMessages>;
type ConversationMessage = ConversationData["messages"][number];

interface UseConversationMessagesOptions {
  conversationId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
}

interface UseConversationMessagesResult {
  data: ConversationWithMessages | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addOptimisticMessage: (message: ConversationMessage) => void;
}

export function useConversationMessages({
  conversationId,
  enabled = true,
  pollIntervalMs = 2000,
}: UseConversationMessagesOptions): UseConversationMessagesResult {
  const [data, setData] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const newData = await response.json();
      setData(newData);
      setError(null);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error("[useConversationMessages] Fetch failed:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error fetching messages")
      );
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    const timeoutId = window.setTimeout(() => {
      void fetchMessages();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, conversationId, fetchMessages]);

  // Polling
  useEffect(() => {
    if (!enabled || !conversationId) return;

    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, pollIntervalMs);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, conversationId, fetchMessages, pollIntervalMs]);

  const addOptimisticMessage = useCallback(
    (message: ConversationMessage) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
            }
          : null
      );
    },
    []
  );

  return {
    data,
    loading,
    error,
    refetch: fetchMessages,
    addOptimisticMessage,
  };
}
