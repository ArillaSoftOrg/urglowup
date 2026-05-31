"use server";

import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

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
