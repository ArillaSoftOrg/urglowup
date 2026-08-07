import { db } from "./db";
import { sendEmail } from "./email";
import { env } from "./env";
import { AppointmentRequestEmail } from "@/emails/appointment-request";
import { AppointmentRequestConfirmationEmail } from "@/emails/appointment-request-confirmation";
import { AppointmentConfirmedEmail } from "@/emails/appointment-confirmed";
import { AppointmentRejectedEmail } from "@/emails/appointment-rejected";
import { AppointmentCancelledByBusinessEmail } from "@/emails/appointment-cancelled-by-business";
import { AppointmentCancelledByCustomerEmail } from "@/emails/appointment-cancelled-by-customer";
import { AppointmentCancellationConfirmationEmail } from "@/emails/appointment-cancellation-confirmation";
import { AppointmentRescheduleRequestEmail } from "@/emails/appointment-reschedule-request";
import { AppointmentReviewRequestEmail } from "@/emails/appointment-review-request";
import React from "react";

// ─── Data Fetcher ────────────────────────────────────────────────

async function getAppointmentEmailPayload(appointmentId: string) {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      customerId: true,
      status: true,
      requestedDate: true,
      requestedTime: true,
      customerNote: true,
      businessNote: true,
      service: { select: { name: true } },
      business: {
        select: {
          name: true,
          slug: true,
          owner: { select: { email: true, firstName: true, lastName: true } },
        },
      },
      customer: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  if (!appt) throw new Error(`Appointment ${appointmentId} not found for email`);
  if (!appt.business.owner || !appt.business.owner.email) throw new Error(`Business owner email missing for appointment ${appointmentId}`);
  return appt;
}

async function isEmailTransactionalEnabled(userId: string): Promise<boolean> {
  const prefs = await db.userPreferences.findUnique({
    where: { userId },
    select: { emailTransactional: true },
  });
  // Missing row = use default (true)
  return prefs?.emailTransactional ?? true;
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fullName(
  firstName: string | null,
  lastName: string | null,
  fallback = "there"
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || fallback;
}

function appUrl(path: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

// ─── Notification Functions ───────────────────────────────────────

/**
 * Sent to the business owner when a customer creates a new appointment request.
 */
export async function sendNewRequestEmailToBusiness(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "PENDING") {
    console.log(
      `[email] sendNewRequestEmailToBusiness: skipped — status is ${appt.status}`
    );
    return;
  }

  await sendEmail({
    to: appt.business.owner!.email,
    subject: `New appointment request from ${fullName(appt.customer.firstName, appt.customer.lastName)}`,
    react: React.createElement(AppointmentRequestEmail, {
      businessOwnerName: fullName(
        appt.business.owner!.firstName,
        appt.business.owner!.lastName,
        ""
      ),
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      customerNote: appt.customerNote ?? undefined,
      dashboardUrl: appUrl("/business/appointments"),
    }),
  });
}

/**
 * Sent to the customer after they successfully submit an appointment request.
 */
export async function sendRequestReceivedEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "PENDING") {
    console.log(
      `[email] sendRequestReceivedEmailToCustomer: skipped — status is ${appt.status}`
    );
    return;
  }

  if (!(await isEmailTransactionalEnabled(appt.customerId))) {
    console.log(`[email] sendRequestReceivedEmailToCustomer: skipped — customer opted out`);
    return;
  }

  await sendEmail({
    to: appt.customer.email,
    subject: `Appointment request received at ${appt.business.name}`,
    react: React.createElement(AppointmentRequestConfirmationEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      customerNote: appt.customerNote ?? undefined,
      dashboardUrl: appUrl("/account/appointments"),
    }),
  });
}

/**
 * Sent to the customer when the business confirms their appointment.
 */
export async function sendConfirmedEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "CONFIRMED") {
    console.log(
      `[email] sendConfirmedEmailToCustomer: skipped — status is ${appt.status}`
    );
    return;
  }

  if (!(await isEmailTransactionalEnabled(appt.customerId))) {
    console.log(`[email] sendConfirmedEmailToCustomer: skipped — customer opted out`);
    return;
  }

  await sendEmail({
    to: appt.customer.email,
    subject: `Your appointment at ${appt.business.name} is confirmed`,
    react: React.createElement(AppointmentConfirmedEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      businessNote: appt.businessNote ?? undefined,
      businessProfileUrl: appUrl(`/b/${appt.business.slug}`),
    }),
  });
}

/**
 * Sent to the customer when the business rejects their appointment request.
 */
export async function sendRejectedEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "REJECTED") {
    console.log(
      `[email] sendRejectedEmailToCustomer: skipped — status is ${appt.status}`
    );
    return;
  }

  if (!(await isEmailTransactionalEnabled(appt.customerId))) {
    console.log(`[email] sendRejectedEmailToCustomer: skipped — customer opted out`);
    return;
  }

  await sendEmail({
    to: appt.customer.email,
    subject: `Your appointment request at ${appt.business.name} was not approved`,
    react: React.createElement(AppointmentRejectedEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      exploreUrl: appUrl("/"),
    }),
  });
}

/**
 * Sent to the customer when the business cancels their appointment.
 */
export async function sendCancelledByBusinessEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "CANCELLED_BY_BUSINESS") {
    console.log(
      `[email] sendCancelledByBusinessEmailToCustomer: skipped — status is ${appt.status}`
    );
    return;
  }

  if (!(await isEmailTransactionalEnabled(appt.customerId))) {
    console.log(`[email] sendCancelledByBusinessEmailToCustomer: skipped — customer opted out`);
    return;
  }

  await sendEmail({
    to: appt.customer.email,
    subject: `Your appointment at ${appt.business.name} has been cancelled`,
    react: React.createElement(AppointmentCancelledByBusinessEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      exploreUrl: appUrl("/"),
    }),
  });
}

/**
 * Sent to the business owner when an admin cancels their appointment on their behalf.
 */
export async function sendAdminCancelledEmailToBusinessOwner(
  appointmentId: string,
  _adminReason: string
): Promise<void> {
  void _adminReason;
  const appt = await getAppointmentEmailPayload(appointmentId);

  const customerName = fullName(appt.customer.firstName, appt.customer.lastName);
  const ownerName = fullName(appt.business.owner!.firstName, appt.business.owner!.lastName, "");

  await sendEmail({
    to: appt.business.owner!.email,
    subject: `Admin cancelled an appointment at ${appt.business.name}`,
    react: React.createElement(AppointmentCancelledByCustomerEmail, {
      businessOwnerName: ownerName,
      customerName,
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      dashboardUrl: appUrl("/business/appointments"),
    }),
    tags: [
      { name: "flow", value: "admin" },
      { name: "template", value: "appointment-admin-cancel" },
    ],
    template: "appointment-admin-cancel",
  });
}

/**
 * Sent to the business owner when a customer cancels their appointment.
 */
export async function sendCancelledByCustomerEmailToBusiness(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "CANCELLED_BY_CUSTOMER") {
    console.log(
      `[email] sendCancelledByCustomerEmailToBusiness: skipped — status is ${appt.status}`
    );
    return;
  }

  await sendEmail({
    to: appt.business.owner!.email,
    subject: `${fullName(appt.customer.firstName, appt.customer.lastName)} cancelled their appointment`,
    react: React.createElement(AppointmentCancelledByCustomerEmail, {
      businessOwnerName: fullName(
        appt.business.owner!.firstName,
        appt.business.owner!.lastName,
        ""
      ),
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      dashboardUrl: appUrl("/business/appointments"),
    }),
  });
}

/**
 * Sent to the customer when they cancel their appointment.
 */
export async function sendCancellationConfirmationEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "CANCELLED_BY_CUSTOMER") {
    console.log(
      `[email] sendCancellationConfirmationEmailToCustomer: skipped — status is ${appt.status}`
    );
    return;
  }

  if (!(await isEmailTransactionalEnabled(appt.customerId))) {
    console.log(`[email] sendCancellationConfirmationEmailToCustomer: skipped — customer opted out`);
    return;
  }

  await sendEmail({
    to: appt.customer.email,
    subject: `Randevunuz iptal edilmiştir — ${appt.business.name}`,
    react: React.createElement(AppointmentCancellationConfirmationEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      requestedDate: formatDate(appt.requestedDate),
      requestedTime: appt.requestedTime,
      dashboardUrl: appUrl("/account/appointments"),
    }),
  });
}

/**
 * Sent to the business when a customer requests to reschedule.
 * Note: appointmentId points to the ORIGINAL appointment; pass originalDate/Time + newDate/Time.
 * newDate format: YYYY-MM-DD, newTime format: HH:MM
 */
export async function sendRescheduleRequestEmailToBusiness(
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  // Parse newDate string (YYYY-MM-DD) into a Date object for formatting
  const newDateObj = new Date(newDate + "T00:00:00Z");

  await sendEmail({
    to: appt.business.owner!.email,
    subject: `${fullName(appt.customer.firstName, appt.customer.lastName)} requested to reschedule their appointment`,
    react: React.createElement(AppointmentRescheduleRequestEmail, {
      businessOwnerName: fullName(
        appt.business.owner!.firstName,
        appt.business.owner!.lastName,
        ""
      ),
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      serviceName: appt.service.name,
      originalDate: formatDate(appt.requestedDate),
      originalTime: appt.requestedTime,
      requestedDate: formatDate(newDateObj),
      requestedTime: newTime,
      dashboardUrl: appUrl("/business/appointments"),
    }),
  });
}

// ─── Moderation Notifications ─────────────────────────────────────

/**
 * Sent to the customer after their appointment is marked as COMPLETED,
 * inviting them to leave a review.
 */
export async function sendReviewRequestEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "COMPLETED") return;
  if (!(await isEmailTransactionalEnabled(appt.customerId))) return;

  const reviewUrl = appUrl(`/account/reviews?write=${appointmentId}`);

  await sendEmail({
    to: appt.customer.email,
    subject: `${appt.business.name} deneyiminizi değerlendirin`,
    react: React.createElement(AppointmentReviewRequestEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      reviewUrl,
    }),
  });
}

/**
 * Sent to business owner when a review is hidden or removed by admin.
 */
export async function sendReviewModeratedEmail(
  reviewId: string,
  action: "hidden" | "removed",
  reason?: string
): Promise<void> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      business: {
        select: {
          name: true,
          owner: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!review) {
    console.log(`[email] sendReviewModeratedEmail: review ${reviewId} not found`);
    return;
  }

  if (!review.business.owner?.email) {
    console.log(`[email] sendReviewModeratedEmail: review ${reviewId} has no business owner email`);
    return;
  }

  const { ContentModeratedEmail } = await import("@/emails/content-moderated");

  await sendEmail({
    to: review.business.owner.email,
    subject: `A review from your ${review.business.name} profile has been ${
      action === "hidden" ? "hidden" : "removed"
    }`,
    react: React.createElement(ContentModeratedEmail, {
      businessName: review.business.name,
      contentType: "review",
      action,
      reason,
    }),
  });
}

/**
 * Sent to business owner when media is hidden or removed by admin.
 */
export async function sendMediaModeratedEmail(
  mediaId: string,
  action: "hidden" | "removed",
  reason?: string
): Promise<void> {
  const media = await db.businessMedia.findUnique({
    where: { id: mediaId },
    include: {
      business: {
        select: {
          name: true,
          owner: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!media) {
    console.log(`[email] sendMediaModeratedEmail: media ${mediaId} not found`);
    return;
  }

  if (!media.business.owner?.email) {
    console.log(`[email] sendMediaModeratedEmail: media ${mediaId} has no business owner email`);
    return;
  }

  const { ContentModeratedEmail } = await import("@/emails/content-moderated");

  await sendEmail({
    to: media.business.owner.email,
    subject: `A media item from your ${media.business.name} profile has been ${
      action === "hidden" ? "hidden" : "removed"
    }`,
    react: React.createElement(ContentModeratedEmail, {
      businessName: media.business.name,
      contentType: "media",
      action,
      reason,
    }),
  });
}

/**
 * Sent to a user to verify their email address during signup or admin resend.
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<void> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://urglowup.vercel.app";
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(email)}`;

  const { AuthEmailVerification } = await import("@/emails/auth-email-verification");

  await sendEmail({
    to: email,
    subject: "Verify your UrGlowUp email address",
    react: React.createElement(AuthEmailVerification, {
      verificationUrl,
    }),
  });
}
