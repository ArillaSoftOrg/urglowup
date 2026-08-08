import { db } from "@urglowup/db";

export type DevicePlatform = "ios" | "android";

export interface RegisterDeviceInput {
  userId: string;
  expoPushToken: string;
  platform: DevicePlatform;
}

/**
 * Upserts by expoPushToken (not by user+platform) — the same physical
 * device's token can outlive a logout/login-as-different-user cycle, and
 * re-registering just needs to reassign ownership + bump lastSeenAt rather
 * than create a duplicate row.
 */
export async function registerDevice(input: RegisterDeviceInput): Promise<{ id: string }> {
  const device = await db.deviceToken.upsert({
    where: { expoPushToken: input.expoPushToken },
    create: {
      userId: input.userId,
      expoPushToken: input.expoPushToken,
      platform: input.platform,
    },
    update: {
      userId: input.userId,
      platform: input.platform,
      lastSeenAt: new Date(),
    },
    select: { id: true },
  });
  return device;
}

export type RemoveDeviceResult = { ok: true } | { ok: false; reason: "NOT_FOUND" };

export async function removeDevice(userId: string, deviceId: string): Promise<RemoveDeviceResult> {
  const device = await db.deviceToken.findUnique({
    where: { id: deviceId },
    select: { userId: true },
  });
  if (!device || device.userId !== userId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  await db.deviceToken.delete({ where: { id: deviceId } });
  return { ok: true };
}

export async function listDeviceTokensForUser(userId: string): Promise<string[]> {
  const devices = await db.deviceToken.findMany({
    where: { userId },
    select: { expoPushToken: true },
  });
  return devices.map((d) => d.expoPushToken);
}

/** Called by the invalid-token cleanup job once Phase 6's cron piece exists. */
export async function removeDeviceTokensByValue(expoPushTokens: string[]): Promise<void> {
  if (expoPushTokens.length === 0) return;
  await db.deviceToken.deleteMany({ where: { expoPushToken: { in: expoPushTokens } } });
}
