import { db } from "@urglowup/db";

/** Cursor-paginated in-app notification feed for one recipient (customer or business staff). */
export async function listNotificationsForUser(
  userId: string,
  options: { cursor?: string; limit: number },
) {
  const rows = await db.inAppNotification.findMany({
    where: { recipientUserId: userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > options.limit;
  const data = hasMore ? rows.slice(0, options.limit) : rows;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
  const notification = await db.inAppNotification.findUnique({
    where: { id: notificationId },
    select: { recipientUserId: true },
  });

  if (!notification || notification.recipientUserId !== userId) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  await db.inAppNotification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  return { ok: true };
}
