"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";

export async function markBusinessNotificationRead(notificationId: string) {
  const { user, businessId } = await requireBusiness();

  await db.inAppNotification.updateMany({
    where: {
      id: notificationId,
      businessId,
      recipientUserId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/business/dashboard");
  revalidatePath("/business/notifications");
}

export async function markAllBusinessNotificationsRead() {
  const { user, businessId } = await requireBusiness();

  await db.inAppNotification.updateMany({
    where: {
      businessId,
      recipientUserId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/business/dashboard");
  revalidatePath("/business/notifications");
}
