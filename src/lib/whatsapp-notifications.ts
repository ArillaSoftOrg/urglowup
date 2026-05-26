import { db } from "./db";
import { normalizeTurkishPhone, maskPhoneForLogging } from "./external/whatsapp/phone";
import { sendWhatsAppTemplateMessage } from "./external/whatsapp/client";

// ─── Data Fetcher ─────────────────────────────────────────────────

async function getAppointmentWhatsAppPayload(appointmentId: string) {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      customerId: true,
      status: true,
      requestedDate: true,
      requestedTime: true,
      customer: { select: { firstName: true, lastName: true, phone: true } },
      business: {
        select: {
          name: true,
          address: true,
          city: true,
          district: true,
        },
      },
      service: { select: { name: true } },
    },
  });

  if (!appt) throw new Error(`Appointment ${appointmentId} not found for WhatsApp`);
  return appt;
}

async function isWhatsAppTransactionalEnabled(userId: string): Promise<boolean> {
  const prefs = await db.userPreferences.findUnique({
    where: { userId },
    select: { whatsappTransactional: true },
  });
  // Missing row = use default (true)
  return prefs?.whatsappTransactional ?? true;
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatDateTurkish(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildAddress(
  address: string | null,
  district: string | null,
  city: string | null,
): string {
  const sanitize = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
  return (
    [address, district, city]
      .filter(Boolean)
      .map((s) => sanitize(s as string))
      .join(", ") || "—"
  );
}

function fullName(
  firstName: string | null,
  lastName: string | null,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || "Değerli Müşterimiz";
}

function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_NOTIFICATIONS_ENABLED === "true";
}

// ─── Duplicate Prevention ─────────────────────────────────────────

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

// ─── Notification Function ────────────────────────────────────────

/**
 * Sends a WhatsApp booking-request confirmation to the customer.
 *
 * Safety guarantees:
 *   - Feature flag off → no-op
 *   - Missing env → FAILED log, no throw
 *   - Invalid phone → SKIPPED log, no throw
 *   - Already sent → skipped via findFirst fast-path
 *   - Race condition → skipped via P2002 catch (DB-level @@unique guard)
 *   - API failure → FAILED log, no throw
 *   - WhatsApp failure never breaks the booking — caller uses after()
 */
export async function sendBookingConfirmationWhatsApp(
  appointmentId: string,
): Promise<void> {
  if (!isWhatsAppEnabled()) {
    console.log("[whatsapp] notifications disabled");
    return;
  }

  const templateName =
    process.env.WHATSAPP_TEMPLATE_BOOKING_CONFIRMED ?? "booking_confirmed";

  let appt: Awaited<ReturnType<typeof getAppointmentWhatsAppPayload>>;
  try {
    appt = await getAppointmentWhatsAppPayload(appointmentId);
  } catch (err) {
    console.error("[whatsapp] failed to fetch appointment", appointmentId, err);
    return;
  }

  if (appt.status !== "PENDING") {
    console.log(
      `[whatsapp] sendBookingConfirmationWhatsApp: skipped — status is ${appt.status}`,
    );
    return;
  }

  if (!(await isWhatsAppTransactionalEnabled(appt.customerId))) {
    console.log(`[whatsapp] sendBookingConfirmationWhatsApp: skipped — customer opted out`);
    return;
  }

  const phone = normalizeTurkishPhone(appt.customer.phone);

  if (phone === null) {
    console.log(
      `[whatsapp] skipped — phone not normalizable: ${maskPhoneForLogging(appt.customer.phone)}`,
    );
    await db.notificationLog
      .create({
        data: {
          appointmentId,
          channel: "WHATSAPP",
          recipientPhone: appt.customer.phone ?? "",
          templateName,
          status: "SKIPPED",
          errorMessage: "invalid or missing phone",
        },
      })
      .catch((err: unknown) => {
        console.error("[whatsapp] failed to write SKIPPED log:", err);
      });
    return;
  }

  // Fast-path: skip if a SENT or in-flight PENDING row already exists
  const blocking = await db.notificationLog
    .findFirst({
      where: {
        appointmentId,
        channel: "WHATSAPP",
        templateName,
        status: { in: ["SENT", "PENDING"] },
      },
      select: { status: true },
    })
    .catch((err: unknown) => {
      console.error("[whatsapp] failed to check duplicate log:", err);
      return null;
    });

  if (blocking) {
    console.log(
      `[whatsapp] skipped — ${blocking.status} record already exists for appointment ${appointmentId}`,
    );
    return;
  }

  // Create PENDING log row — @@unique([appointmentId, channel, templateName])
  // is the DB-level guard against races that slip past the findFirst above.
  let log: { id: string };
  try {
    log = await db.notificationLog.create({
      data: {
        appointmentId,
        channel: "WHATSAPP",
        recipientPhone: phone,
        templateName,
        status: "PENDING",
      },
      select: { id: true },
    });
  } catch (err) {
    if (isPrismaUniqueError(err)) {
      console.log(
        `[whatsapp] skipped — race condition resolved by DB unique constraint for appointment ${appointmentId}`,
      );
      return;
    }
    console.error("[whatsapp] failed to create PENDING log:", err);
    return;
  }

  // Send the message
  try {
    const messageId = await sendWhatsAppTemplateMessage({
      to: phone,
      customerName: fullName(appt.customer.firstName, appt.customer.lastName),
      businessName: appt.business.name,
      serviceName: appt.service.name,
      bookingDate: formatDateTurkish(appt.requestedDate),
      bookingTime: appt.requestedTime,
      businessAddress: buildAddress(
        appt.business.address,
        appt.business.district,
        appt.business.city,
      ),
    });

    await db.notificationLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerMessageId: messageId, sentAt: new Date() },
    });
  } catch (err) {
    console.error(
      "[whatsapp] failed to send for appointment",
      appointmentId,
      err,
    );
    await db.notificationLog
      .update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      })
      .catch((dbErr: unknown) => {
        console.error(
          "[whatsapp] also failed to persist FAILED status:",
          dbErr,
        );
      });
    // No rethrow — booking flow must not be affected
  }
}
