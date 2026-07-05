"use server";

import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { logAuthEvent } from "@/lib/auth-security";

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
): Promise<void> {
  try {
    await db.adminAction.create({
      data: { adminId, action, targetType, targetId, details },
    });
  } catch (err) {
    console.error("Failed to log MFA action:", err);
  }
}

export async function logMfaEvent(action: string, details: string): Promise<void> {
  const user = await requireRole(UserRole.ADMIN);
  await logAdminAction(user.id, action, "User", user.id, details);
}

// Records a failed MFA verification. During a two-factor challenge Better Auth
// has deleted the session, so this must NOT call requireRole and must not
// persist a (spoofable) identity — it is a console-only security event.
export async function logMfaChallengeFailure(
  method: "totp" | "backup",
): Promise<void> {
  logAuthEvent("warn", "admin.mfa_challenge_failed", { method });
}
