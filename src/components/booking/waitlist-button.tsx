"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check } from "lucide-react";
import { joinWaitlist } from "@/app/(public)/b/[slug]/book/waitlist-actions";

interface WaitlistButtonProps {
  businessId: string;
  serviceId: string;
  date: string;
  time: string;
  isLoggedIn: boolean;
}

export function WaitlistButton({ businessId, serviceId, date, time, isLoggedIn }: WaitlistButtonProps) {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleJoin() {
    if (!isLoggedIn) {
      window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    startTransition(async () => {
      const result = await joinWaitlist(businessId, serviceId, date, time);
      if (result.success) setJoined(true);
      else setError(result.message);
    });
  }

  if (joined) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success-foreground">
        <Check className="size-4" />
        Bekleme listesine eklendiniz! Yer açılınca bildirileceksiniz.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleJoin}
        disabled={isPending}
        className="gap-2"
      >
        {isPending ? <BellOff className="size-4 animate-pulse" /> : <Bell className="size-4" />}
        {time} — Bekleme listesine gir
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
