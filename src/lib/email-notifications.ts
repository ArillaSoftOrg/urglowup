import { db } from "./db";
import { sendEmail } from "./email";
import { env } from "./env";
import { AppointmentRequestEmail } from "@/emails/appointment-request";
import { AppointmentRequestConfirmationEmail } from "@/emails/appointment-request-confirmation";
import { AppointmentConfirmedEmail } from "@/emails/appointment-confirmed";
import { AppointmentRejectedEmail } from "@/emails/appointment-rejected";
import { AppointmentCancelledByBusinessEmail } from "@/emails/appointment-cancelled-by-business";
import { AppointmentCancelledByCustomerEmail } from "@/emails/appointment-cancelled-by-customer";
import { ReviewRequestEmail } from "@/emails/review-request";
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
    to: appt.business.owner.email,
    subject: `New appointment request from ${fullName(appt.customer.firstName, appt.customer.lastName)}`,
    react: React.createElement(AppointmentRequestEmail, {
      businessOwnerName: fullName(
        appt.business.owner.firstName,
        appt.business.owner.lastName,
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
    to: appt.business.owner.email,
    subject: `${fullName(appt.customer.firstName, appt.customer.lastName)} cancelled their appointment`,
    react: React.createElement(AppointmentCancelledByCustomerEmail, {
      businessOwnerName: fullName(
        appt.business.owner.firstName,
        appt.business.owner.lastName,
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
 * Sent to the customer when the business marks their appointment as completed.
 */
export async function sendReviewRequestEmailToCustomer(
  appointmentId: string
): Promise<void> {
  const appt = await getAppointmentEmailPayload(appointmentId);

  if (appt.status !== "COMPLETED") {
    console.log(
      `[email] sendReviewRequestEmailToCustomer: skipped — status is ${appt.status}`
    );
    return;
  }

  if (!(await isEmailTransactionalEnabled(appt.customerId))) {
    console.log(`[email] sendReviewRequestEmailToCustomer: skipped — customer opted out`);
    return;
  }

  await sendEmail({
    to: appt.customer.email,
    subject: `How was your experience at ${appt.business.name}?`,
    react: React.createElement(ReviewRequestEmail, {
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      reviewUrl: appUrl("/account/reviews"),
    }),
  });
}

// ─── Moderation Notifications ─────────────────────────────────────

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
 * Sent to business owner when a post is hidden or removed by admin.
 */
export async function sendPostModeratedEmail(
  postId: string,
  action: "hidden" | "removed",
  reason?: string
): Promise<void> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      business: {
        select: {
          name: true,
          owner: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!post) {
    console.log(`[email] sendPostModeratedEmail: post ${postId} not found`);
    return;
  }

  const { ContentModeratedEmail } = await import("@/emails/content-moderated");

  await sendEmail({
    to: post.business.owner.email,
    subject: `A post from your ${post.business.name} profile has been ${
      action === "hidden" ? "hidden" : "removed"
    }`,
    react: React.createElement(ContentModeratedEmail, {
      businessName: post.business.name,
      contentType: "post",
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
