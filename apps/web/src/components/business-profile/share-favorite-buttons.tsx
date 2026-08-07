"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/app/(public)/b/[slug]/favorite-action";

interface ShareFavoriteButtonsProps {
  businessId: string;
  businessName: string;
  businessSlug: string;
  initialIsFavorited: boolean;
  isLoggedIn: boolean;
  variant?: "desktop" | "mobile";
}

export function ShareFavoriteButtons({
  businessId,
  businessName,
  businessSlug,
  initialIsFavorited,
  isLoggedIn,
  variant = "mobile",
}: ShareFavoriteButtonsProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [shared, setShared] = useState(false);
  const [isPending, startTransition] = useTransition();

  const buttonClass =
    variant === "desktop"
      ? "flex size-13 items-center justify-center rounded-full border bg-background shadow-sm transition hover:bg-muted"
      : "inline-flex size-10 items-center justify-center rounded-full hover:bg-muted transition";

  function handleShare() {
    const url = `${window.location.origin}/b/${businessSlug}`;
    if (typeof navigator.share === "function") {
      navigator.share({ title: businessName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      });
    }
  }

  function handleFavorite() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const next = !isFavorited;
    setIsFavorited(next);
    startTransition(async () => {
      try {
        const result = await toggleFavorite(businessId);
        setIsFavorited(result.isFavorited);
      } catch {
        setIsFavorited(!next);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Paylaş"
        onClick={handleShare}
        className={buttonClass}
      >
        {shared ? (
          <Check className="size-5 text-success-foreground" />
        ) : (
          <Share2 className="size-5" />
        )}
      </button>
      <button
        type="button"
        aria-label={isFavorited ? "Favorilerden çıkar" : "Favorilere ekle"}
        onClick={handleFavorite}
        disabled={isPending}
        className={cn(buttonClass, "disabled:opacity-70")}
      >
        <Heart
          className={cn(
            "size-5 transition-colors",
            isFavorited && "fill-rose-500 text-rose-500",
          )}
        />
      </button>
    </>
  );
}
