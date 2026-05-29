import type { User } from "@/generated/prisma/client";

export function isSuspended(user: User | null): boolean {
  if (!user) return false;
  if (!user.suspendedAt) return false;

  const now = new Date();

  // If suspension is indefinite (no suspendedUntil), it's permanent
  if (!user.suspendedUntil) return true;

  // If we haven't passed the expiry yet, it's still active
  return now < user.suspendedUntil;
}

export function getSuspensionStatus(
  user: User | null
): { isSuspended: boolean; expiresAt: Date | null; reason: string | null } {
  if (!user || !user.suspendedAt) {
    return { isSuspended: false, expiresAt: null, reason: null };
  }

  const now = new Date();
  const isSuspendedNow = !user.suspendedUntil || now < user.suspendedUntil;

  return {
    isSuspended: isSuspendedNow,
    expiresAt: user.suspendedUntil,
    reason: user.suspensionReason,
  };
}

export function formatSuspensionCountdown(expiresAt: Date | null): string {
  if (!expiresAt) return "Indefinite";

  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();

  if (diffMs < 0) return "Expired";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays}d remaining`;
  if (diffHours > 0) return `${diffHours}h remaining`;
  if (diffMins > 0) return `${diffMins}m remaining`;
  return "Expires soon";
}
