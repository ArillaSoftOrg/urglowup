import { db, Prisma } from "@urglowup/db";

/**
 * Shared concurrency primitive for every booking write that targets one
 * (business, professional, date, time) slot — appointment creation
 * (create-appointment.ts), customer reschedule (reschedule-appointment.ts),
 * and business-side manual/walk-in creation
 * (apps/web/.../business/appointments/actions.ts's createAppointment). One
 * implementation, reused everywhere, rather than three copies of the same
 * lock-then-recheck-then-write dance.
 *
 * Correctness relies on two layers: a Postgres advisory lock scoped to this
 * exact slot (fast path — serializes concurrent attempts at the same slot
 * without blocking unrelated slots), and the partial unique index on
 * Appointment as the hard backstop (see the booking_hardening migration) in
 * case the lock is ever bypassed. This does not guard against two
 * *different*, *overlapping* time slots being double-booked — only against
 * two requests for the exact same slot; that's a pre-existing, documented
 * limitation of the whole system's concurrency model, not something this
 * primitive changes.
 */
export function slotLockKey(
  businessId: string,
  professionalId: string | null,
  requestedDate: string,
  requestedTime: string,
): string {
  return [businessId, professionalId ?? "unassigned", requestedDate, requestedTime].join(":");
}

/**
 * Runs `fn` inside a transaction that holds a Postgres advisory lock on
 * `lockKey` for the transaction's duration — any other caller locking the
 * same key blocks until this transaction commits or rolls back.
 */
export async function runInSlotLock<T>(
  lockKey: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    return fn(tx);
  });
}

/**
 * True for a Prisma unique-constraint violation (P2002) — the partial
 * unique index backstop firing. Should be unreachable when a write is
 * properly wrapped in runInSlotLock with a fresh in-transaction conflict
 * re-check first; callers still need to catch it as defense-in-depth in
 * case the lock is ever bypassed.
 */
export function isSlotConflictError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
