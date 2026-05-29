"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { formatSuspensionCountdown } from "@/lib/admin/user-suspension";

interface SuspensionStatusBadgeProps {
  suspendedAt: Date | null;
  suspendedUntil: Date | null;
  suspensionReason?: string | null;
  size?: "sm" | "md";
}

export function SuspensionStatusBadge({
  suspendedAt,
  suspendedUntil,
  suspensionReason,
  size = "sm",
}: SuspensionStatusBadgeProps) {
  if (!suspendedAt) return null;

  const countdown = formatSuspensionCountdown(suspendedUntil);
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";

  return (
    <Badge
      className={`${padding} bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 ${textSize}`}
      title={suspensionReason || "User suspended"}
    >
      <AlertCircle className="size-3" />
      Suspended ({countdown})
    </Badge>
  );
}
