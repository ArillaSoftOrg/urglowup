import crypto from "crypto";
import { db } from "./db";

export async function ensureUnsubscribeToken(userId: string): Promise<string> {
  // Check if token already exists
  let token = await db.unsubscribeToken.findUnique({
    where: { userId },
    select: { token: true, usedAt: true },
  });

  // If token exists and hasn't been used, return it
  if (token && !token.usedAt) {
    return token.token;
  }

  // Generate new token
  const newToken = crypto.randomBytes(32).toString("hex");

  // Create or replace token
  await db.unsubscribeToken.upsert({
    where: { userId },
    create: {
      userId,
      token: newToken,
    },
    update: {
      token: newToken,
      usedAt: null, // Reset usedAt if re-generating
    },
  });

  return newToken;
}

export async function verifyAndUseUnsubscribeToken(token: string): Promise<string | null> {
  const record = await db.unsubscribeToken.findUnique({
    where: { token },
    select: { userId: true, usedAt: true },
  });

  if (!record || record.usedAt) {
    return null; // Token not found or already used
  }

  return record.userId;
}

export async function revokeMarketingConsent(userId: string): Promise<void> {
  const now = new Date();

  // Mark unsubscribe token as used
  await db.unsubscribeToken.updateMany({
    where: { userId },
    data: { usedAt: now },
  });

  // Update user preferences
  await db.userPreferences.update({
    where: { userId },
    data: {
      emailMarketing: false,
      whatsappMarketing: false,
    },
  });

  // Log to consent audit
  await db.consentAuditLog.create({
    data: {
      userId,
      category: "MARKETING",
      action: "REVOKED",
      version: "unsubscribe-link-clicked",
    },
  });
}
