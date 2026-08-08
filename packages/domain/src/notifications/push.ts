import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { listDeviceTokensForUser, removeDeviceTokensByValue } from "./devices";

const expo = new Expo();

export interface SendPushInput {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Sends a push notification to every device registered for a user. Expo's
 * push service is the standard choice for Expo-managed apps — it fans out to
 * both APNs and FCM without the app needing to manage those credentials
 * directly. Invalid tokens (DeviceNotRegistered) are pruned inline from the
 * send response rather than waiting for a separate receipt-polling job,
 * since Expo's push *tickets* already flag malformed/unregistered tokens
 * synchronously; delivery-time failures still need the receipt-polling job
 * (Phase 6 follow-up, not built in this pass) to catch those.
 */
export async function sendPushToUser(userId: string, message: SendPushInput): Promise<void> {
  const tokens = await listDeviceTokensForUser(userId);
  if (tokens.length === 0) return;

  const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
  const invalidTokens = tokens.filter((token) => !Expo.isExpoPushToken(token));
  if (invalidTokens.length > 0) {
    await removeDeviceTokensByValue(invalidTokens);
  }
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = validTokens.map((to) => ({
    to,
    title: message.title,
    body: message.body,
    data: message.data,
    sound: "default",
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const staleTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, index) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          const to = chunk[index]?.to;
          if (typeof to === "string") staleTokens.push(to);
        }
      });
    } catch (err) {
      console.error("[push] chunk send failed:", err);
    }
  }

  if (staleTokens.length > 0) {
    await removeDeviceTokensByValue(staleTokens);
  }
}
