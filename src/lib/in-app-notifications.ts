import { BusinessMemberRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

type NotificationPayload = {
  businessId: string;
  appointmentId?: string;
  type:
    | "APPOINTMENT_REQUESTED"
    | "APPOINTMENT_CANCELLED_BY_CUSTOMER"
    | "APPOINTMENT_RESCHEDULED_BY_CUSTOMER"
    | "REVIEW_RECEIVED"
    | "PROFILE_ATTENTION"
    | "INTEGRATION_ALERT"
    | "TEAM_UPDATE";
  title: string;
  body: string;
  href: string;
};

async function getBusinessNotificationRecipientIds(businessId: string) {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      ownerId: true,
      members: {
        where: {
          role: { in: [BusinessMemberRole.OWNER, BusinessMemberRole.MANAGER] },
        },
        select: { userId: true },
      },
    },
  });

  if (!business) return [];

  return Array.from(
    new Set([business.ownerId, ...business.members.map((member) => member.userId)])
  );
}

export async function createBusinessInAppNotification(
  payload: NotificationPayload
) {
  const recipientIds = await getBusinessNotificationRecipientIds(payload.businessId);

  if (recipientIds.length === 0) {
    return { count: 0 };
  }

  return db.inAppNotification.createMany({
    data: recipientIds.map((recipientUserId) => ({
      businessId: payload.businessId,
      recipientUserId,
      appointmentId: payload.appointmentId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      href: payload.href,
    })),
  });
}

export async function notifyBusinessAppointmentRequested(appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      businessId: true,
      requestedDate: true,
      requestedTime: true,
      customer: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      service: { select: { name: true } },
    },
  });

  if (!appointment) return { count: 0 };

  const customerName = formatUserName(appointment.customer);

  return createBusinessInAppNotification({
    businessId: appointment.businessId,
    appointmentId: appointment.id,
    type: "APPOINTMENT_REQUESTED",
    title: "Yeni randevu talebi",
    body: `${customerName}, ${appointment.service.name} icin ${formatDateTime(
      appointment.requestedDate,
      appointment.requestedTime
    )} saatine talep olusturdu.`,
    href: `/business/appointments?tab=pending&appointmentId=${appointment.id}`,
  });
}

export async function notifyBusinessAppointmentCancelledByCustomer(
  appointmentId: string
) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      businessId: true,
      requestedDate: true,
      requestedTime: true,
      customer: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
        },
      },
      service: { select: { name: true } },
    },
  });

  if (!appointment) return { count: 0 };

  const customerName = formatUserName(appointment.customer);

  return createBusinessInAppNotification({
    businessId: appointment.businessId,
    appointmentId: appointment.id,
    type: "APPOINTMENT_CANCELLED_BY_CUSTOMER",
    title: "Randevu musteri tarafindan iptal edildi",
    body: `${customerName}, ${appointment.service.name} randevusunu iptal etti: ${formatDateTime(
      appointment.requestedDate,
      appointment.requestedTime
    )}.`,
    href: `/business/appointments?appointmentId=${appointment.id}`,
  });
}

export async function notifyBusinessAppointmentRescheduledByCustomer(
  appointmentId: string
) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      businessId: true,
      requestedDate: true,
      requestedTime: true,
      customer: { select: { name: true, firstName: true, lastName: true } },
      service: { select: { name: true } },
    },
  });

  if (!appointment) return { count: 0 };

  const customerName = formatUserName(appointment.customer);

  return createBusinessInAppNotification({
    businessId: appointment.businessId,
    appointmentId: appointment.id,
    type: "APPOINTMENT_RESCHEDULED_BY_CUSTOMER",
    title: "Randevu yeniden planlandı",
    body: `${customerName}, ${appointment.service.name} randevusunu ${formatDateTime(
      appointment.requestedDate,
      appointment.requestedTime
    )} olarak güncelledi.`,
    href: `/business/appointments?appointmentId=${appointment.id}`,
  });
}

export async function notifyBusinessReviewReceived(reviewId: string) {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      businessId: true,
      rating: true,
      customer: { select: { name: true, firstName: true, lastName: true } },
      business: { select: { slug: true } },
    },
  });

  if (!review) return { count: 0 };

  const customerName = formatUserName(review.customer);

  return createBusinessInAppNotification({
    businessId: review.businessId,
    type: "REVIEW_RECEIVED",
    title: "Yeni yorum",
    body: `${customerName} ${review.rating} puan verdi.`,
    href: `/business/reviews`,
  });
}

function formatUserName(user: {
  name: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.name || "Musteri";
}

function formatDateTime(date: Date, time: string) {
  return `${date.toLocaleDateString("tr-TR")} ${time}`;
}
