import { db } from "@urglowup/db";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { listDeviceTokensForUser, removeDeviceTokensByValue } from "./devices";

const expo = new Expo();

// Expo recommends waiting at least 15 minutes before a ticket's receipt is
// available; receipts aren't retained indefinitely, so also cap how far
// back checkPushReceipts looks.
const RECEIPT_MIN_AGE_MS = 15 * 60 * 1000;
const RECEIPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
 * send response when Expo's push *tickets* flag them synchronously;
 * delivery-time failures that only surface in the *receipt* (fetchable
 * 15min-1day later) are handled by checkPushReceipts below, via tickets
 * persisted here.
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
  const pendingTickets: { expoPushToken: string; ticketId: string }[] = [];

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, index) => {
        const to = chunk[index]?.to;
        if (ticket.status === "error") {
          if (ticket.details?.error === "DeviceNotRegistered" && typeof to === "string") {
            staleTokens.push(to);
          }
        } else if (typeof to === "string") {
          pendingTickets.push({ expoPushToken: to, ticketId: ticket.id });
        }
      });
    } catch (err) {
      console.error("[push] chunk send failed:", err);
    }
  }

  if (staleTokens.length > 0) {
    await removeDeviceTokensByValue(staleTokens);
  }
  if (pendingTickets.length > 0) {
    await db.pushTicket.createMany({ data: pendingTickets, skipDuplicates: true });
  }
}

export interface PushReceiptCheckResult {
  checked: number;
  staleTokensRemoved: number;
}

/**
 * Fetches receipts for previously-sent push tickets (Phase 6 follow-up,
 * called by apps/web/src/app/api/internal/push-receipts on a cron) and
 * prunes tokens whose delivery failed with DeviceNotRegistered. Processed
 * tickets are deleted regardless of outcome — once checked, a receipt isn't
 * re-checked, and Expo doesn't retain them past ~1 day anyway.
 */
export async function checkPushReceipts(batchSize = 1000): Promise<PushReceiptCheckResult> {
  const now = Date.now();
  const tickets = await db.pushTicket.findMany({
    where: {
      createdAt: {
        lte: new Date(now - RECEIPT_MIN_AGE_MS),
        gte: new Date(now - RECEIPT_MAX_AGE_MS),
      },
    },
    take: batchSize,
  });

  if (tickets.length === 0) {
    return { checked: 0, staleTokensRemoved: 0 };
  }

  const ticketsByReceiptId = new Map(tickets.map((t) => [t.ticketId, t]));
  const staleTokens: string[] = [];

  const chunks = expo.chunkPushNotificationReceiptIds(tickets.map((t) => t.ticketId));
  for (const chunk of chunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
          const token = receipt.details.expoPushToken ?? ticketsByReceiptId.get(receiptId)?.expoPushToken;
          if (token) staleTokens.push(token);
        }
      }
    } catch (err) {
      console.error("[push] receipt chunk check failed:", err);
    }
  }

  if (staleTokens.length > 0) {
    await removeDeviceTokensByValue(staleTokens);
  }

  await db.pushTicket.deleteMany({ where: { id: { in: tickets.map((t) => t.id) } } });

  return { checked: tickets.length, staleTokensRemoved: staleTokens.length };
}
