import { db, Prisma, type AppointmentStatus } from "@urglowup/db";
import type { CreateAppointmentInput, CreateAppointmentResult } from "./types";

/** Statuses that occupy a time slot (block other bookings for that slot). */
const BLOCKING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

function slotLockKey(input: CreateAppointmentInput): string {
  return [
    input.businessId,
    input.primaryProfessionalId ?? "unassigned",
    input.requestedDate,
    input.requestedTime,
  ].join(":");
}

/**
 * Creates an appointment request, guarding against the two concurrency bugs
 * the previous implementation had: two customers booking the same slot at
 * the same time, and a coupon being used past its usage limit.
 *
 * Correctness relies on two layers: a Postgres advisory lock scoped to this
 * exact slot (fast path — serializes concurrent attempts at the same slot
 * without blocking unrelated slots), and a partial unique index on
 * Appointment as the hard backstop (see the booking_hardening migration) in
 * case the lock is ever bypassed. This does not guard against two
 * *different*, *overlapping* time slots being double-booked — only against
 * two requests for the exact same slot. General overlap-based scheduling
 * conflicts are still resolved at the availability-computation layer
 * (src/lib/slots.ts), not enforced at the database level.
 */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreateAppointmentResult> {
  if (input.idempotencyKey) {
    const existing = await db.idempotencyKey.findUnique({
      where: { key: input.idempotencyKey },
      select: { responseBody: true },
    });
    if (existing) {
      return existing.responseBody as unknown as CreateAppointmentResult;
    }
  }

  const lockKey = slotLockKey(input);
  const requestedDate = new Date(input.requestedDate);

  const result = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const slotConflict = await tx.appointment.findFirst({
      where: {
        businessId: input.businessId,
        professionalId: input.primaryProfessionalId,
        requestedDate,
        requestedTime: input.requestedTime,
        status: { in: BLOCKING_STATUSES },
      },
      select: { id: true },
    });
    if (slotConflict) {
      return { ok: false, reason: "SLOT_TAKEN" } satisfies CreateAppointmentResult;
    }

    const customerDuplicate = await tx.appointment.findFirst({
      where: {
        customerId: input.customerId,
        businessId: input.businessId,
        requestedDate,
        requestedTime: input.requestedTime,
        status: { in: BLOCKING_STATUSES },
      },
      select: { id: true },
    });
    if (customerDuplicate) {
      return { ok: false, reason: "DUPLICATE_CUSTOMER_BOOKING" } satisfies CreateAppointmentResult;
    }

    if (input.couponId) {
      const decremented = await tx.$executeRaw`
        UPDATE "Coupon"
        SET "usedCount" = "usedCount" + 1
        WHERE "id" = ${input.couponId}
          AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
      `;
      if (decremented === 0) {
        return { ok: false, reason: "COUPON_EXHAUSTED" } satisfies CreateAppointmentResult;
      }
    }

    try {
      const appointment = await tx.appointment.create({
        data: {
          businessId: input.businessId,
          customerId: input.customerId,
          serviceId: input.primaryServiceId,
          professionalId: input.primaryProfessionalId,
          couponId: input.couponId,
          discountAmount: input.discountAmount ?? undefined,
          requestedDate,
          requestedTime: input.requestedTime,
          isGroup: input.isGroup,
          guestCount: input.guestCount,
          totalDurationMinutes: input.totalDurationMinutes,
          totalPrice: input.totalPrice ?? undefined,
          firstVisit: input.firstVisit ?? undefined,
          status: "PENDING",
          customerNote: input.customerNote ?? undefined,
          items: {
            create: input.items.map((item, index) => ({
              guestName: item.guestName,
              guestIndex: item.guestIndex,
              serviceId: item.serviceId,
              professionalId: item.professionalId,
              durationMinutes: item.durationMinutes,
              priceSnapshot: item.priceSnapshot ?? undefined,
              sortOrder: index,
            })),
          },
        },
        select: { id: true },
      });

      return { ok: true, appointmentId: appointment.id } satisfies CreateAppointmentResult;
    } catch (err) {
      // Defense-in-depth: the advisory lock above should make this
      // unreachable in normal operation, but the partial unique index is
      // the hard backstop if it's ever bypassed.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { ok: false, reason: "SLOT_TAKEN" } satisfies CreateAppointmentResult;
      }
      throw err;
    }
  });

  if (input.idempotencyKey) {
    try {
      await db.idempotencyKey.create({
        data: {
          key: input.idempotencyKey,
          responseBody: result as unknown as Prisma.InputJsonValue,
        },
      });
    } catch {
      // A concurrent request with the same key already stored a result
      // first; both requests produced the same outcome, nothing to do.
    }
  }

  return result;
}
