"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type WaitlistActionState = { success: boolean; message: string };

export async function joinWaitlist(
  businessId: string,
  serviceId: string,
  date: string,
  time: string
): Promise<WaitlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Giriş yapmalısınız." };

  const rateLimit = await enforceRateLimit({
    scope: "booking",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 40,
    subjectLimit: 20,
  });
  if (!rateLimit.ok) {
    return { success: false, message: rateLimit.message };
  }

  const dateObj = new Date(date + "T00:00:00");

  try {
    await db.waitlistEntry.upsert({
      where: {
        businessId_customerId_serviceId_date_time: {
          businessId,
          customerId: user.id,
          serviceId,
          date: dateObj,
          time,
        },
      },
      create: { businessId, customerId: user.id, serviceId, date: dateObj, time },
      update: {},
    });
    revalidatePath(`/account/appointments`);
    return { success: true, message: "Bekleme listesine eklendiniz. Yer açılınca bildirileceksiniz." };
  } catch {
    return { success: false, message: "Bir hata oluştu." };
  }
}

export async function leaveWaitlist(entryId: string): Promise<WaitlistActionState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Giriş yapmalısınız." };

  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.customerId !== user.id)
    return { success: false, message: "Bulunamadı." };

  await db.waitlistEntry.delete({ where: { id: entryId } });
  return { success: true, message: "Bekleme listesinden çıkarıldınız." };
}

// Called after appointment cancellation — notify first waitlisted person
export async function notifyWaitlist(
  businessId: string,
  serviceId: string,
  date: string,
  time: string
): Promise<void> {
  const dateObj = new Date(date + "T00:00:00");

  const entry = await db.waitlistEntry.findFirst({
    where: {
      businessId,
      serviceId,
      date: dateObj,
      time,
      notifiedAt: null,
    },
    include: {
      customer: { select: { email: true, firstName: true } },
      business: { select: { name: true, slug: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!entry) return;

  await db.waitlistEntry.update({
    where: { id: entry.id },
    data: { notifiedAt: new Date() },
  });

  // In a production app, send email here
  // For now, just mark as notified — email integration follows email-notifications.ts pattern
  console.log(
    `[waitlist] Notified ${entry.customer.email} for ${entry.business.name} — ${entry.service.name} on ${date} ${time}`
  );
}
