"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/app/(customer)/account/messages/actions";

export function MessageBusinessButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await getOrCreateConversation(businessId);
      if (result.success && result.conversationId) {
        router.push(`/account/messages?conversation=${result.conversationId}`);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <MessageCircle className="size-3.5" />}
      Mesaj gönder
    </Button>
  );
}
