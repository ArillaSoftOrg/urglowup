import { useEffect, useRef, useState, useCallback } from "react";

interface UseTypingIndicatorOptions {
  conversationId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
  typingTimeoutMs?: number;
}

interface UseTypingIndicatorResult {
  isOtherTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;
}

export function useTypingIndicator({
  conversationId,
  enabled = true,
  pollIntervalMs = 500, // Check every 500ms
  typingTimeoutMs = 3000, // Show "typing" for 3 seconds after last update
}: UseTypingIndicatorOptions): UseTypingIndicatorResult {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTypingStateRef = useRef<boolean>(false);

  // Check if other user is typing
  const checkTypingStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/typing`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.isTyping) {
          setIsOtherTyping(true);
          lastTypingStateRef.current = true;

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Hide typing indicator after timeout of no updates
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
            lastTypingStateRef.current = false;
          }, typingTimeoutMs);
        }
      }
    } catch (err) {
      console.error("[useTypingIndicator] Check failed:", err);
    }
  }, [conversationId, typingTimeoutMs]);

  // Polling
  useEffect(() => {
    if (!enabled) return;

    const timeoutId = window.setTimeout(() => {
      void checkTypingStatus();
    }, 0);
    pollIntervalRef.current = setInterval(checkTypingStatus, pollIntervalMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [enabled, conversationId, pollIntervalMs, checkTypingStatus]);

  const setIsTyping = useCallback(
    async (isTyping: boolean) => {
      if (isTyping === lastTypingStateRef.current) {
        return; // No change
      }

      lastTypingStateRef.current = isTyping;

      try {
        await fetch(
          `/api/messages/conversations/${conversationId}/typing`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isTyping }),
          }
        );
      } catch (err) {
        console.error("[useTypingIndicator] Send failed:", err);
      }
    },
    [conversationId]
  );

  return {
    isOtherTyping,
    setIsTyping,
  };
}
