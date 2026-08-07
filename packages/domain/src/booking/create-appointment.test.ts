import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });

const { db } = await import("@urglowup/db");
const { createAppointment } = await import("./create-appointment");

// Integration test against a real database (see DATABASE_URL) — this suite
// creates its own throwaway fixtures and deletes them afterwards. It does
// not touch any pre-existing rows.

let businessId: string;
let serviceId: string;
let customerAId: string;
let customerBId: string;
const createdAppointmentIds: string[] = [];
const createdIdempotencyKeys: string[] = [];
let couponId: string;

before(async () => {
  const suffix = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const business = await db.business.create({
    data: { name: `Concurrency Test Business ${suffix}`, slug: `biz-${suffix}` },
  });
  businessId = business.id;

  const service = await db.businessService.create({
    data: {
      businessId,
      name: "Test Service",
      slug: `service-${suffix}`,
      durationMinutes: 30,
      price: 100,
    },
  });
  serviceId = service.id;

  const customerA = await db.user.create({
    data: { email: `customer-a-${suffix}@example.test` },
  });
  customerAId = customerA.id;

  const customerB = await db.user.create({
    data: { email: `customer-b-${suffix}@example.test` },
  });
  customerBId = customerB.id;

  const coupon = await db.coupon.create({
    data: {
      businessId,
      code: `TEST-${suffix}`,
      type: "PERCENTAGE",
      value: 10,
      usageLimit: 1,
    },
  });
  couponId = coupon.id;
});

after(async () => {
  if (createdAppointmentIds.length > 0) {
    await db.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdIdempotencyKeys.length > 0) {
    await db.idempotencyKey.deleteMany({ where: { key: { in: createdIdempotencyKeys } } });
  }
  if (couponId) await db.coupon.delete({ where: { id: couponId } }).catch(() => {});
  if (serviceId) await db.businessService.delete({ where: { id: serviceId } }).catch(() => {});
  if (businessId) await db.business.delete({ where: { id: businessId } }).catch(() => {});
  if (customerAId) await db.user.delete({ where: { id: customerAId } }).catch(() => {});
  if (customerBId) await db.user.delete({ where: { id: customerBId } }).catch(() => {});
  await db.$disconnect();
});

function baseInput(overrides: Partial<Parameters<typeof createAppointment>[0]> = {}) {
  return {
    businessId,
    customerId: customerAId,
    primaryServiceId: serviceId,
    primaryProfessionalId: null,
    couponId: null,
    discountAmount: null,
    requestedDate: "2027-01-15",
    requestedTime: "10:00",
    customerNote: null,
    firstVisit: null,
    isGroup: false,
    guestCount: 1,
    totalDurationMinutes: 30,
    totalPrice: 100,
    items: [
      {
        guestName: "Ben",
        guestIndex: 0,
        serviceId,
        professionalId: null,
        durationMinutes: 30,
        priceSnapshot: 100,
      },
    ],
    ...overrides,
  };
}

test("two concurrent requests for the same slot: exactly one succeeds", async () => {
  const [resultA, resultB] = await Promise.all([
    createAppointment(baseInput({ customerId: customerAId, requestedTime: "11:00" })),
    createAppointment(baseInput({ customerId: customerBId, requestedTime: "11:00" })),
  ]);

  const results = [resultA, resultB];
  for (const r of results) {
    if (r.ok) createdAppointmentIds.push(r.appointmentId);
  }

  const successes = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);

  assert.equal(successes.length, 1, "exactly one of the two concurrent requests should succeed");
  assert.equal(failures.length, 1);
  assert.equal(!failures[0].ok && failures[0].reason, "SLOT_TAKEN");

  const rows = await db.appointment.findMany({
    where: { businessId, requestedDate: new Date("2027-01-15"), requestedTime: "11:00" },
  });
  assert.equal(rows.length, 1, "only one row should exist for the contested slot");
});

test("idempotency key: a retried request replays the first result instead of duplicating", async () => {
  const key = `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  createdIdempotencyKeys.push(key);

  const first = await createAppointment(
    baseInput({ requestedTime: "12:00", idempotencyKey: key }),
  );
  assert.ok(first.ok);
  createdAppointmentIds.push(first.appointmentId);

  const second = await createAppointment(
    baseInput({ requestedTime: "12:00", idempotencyKey: key }),
  );

  assert.ok(second.ok);
  assert.equal(second.appointmentId, first.appointmentId, "should replay the same appointment");

  const rows = await db.appointment.findMany({
    where: { businessId, requestedDate: new Date("2027-01-15"), requestedTime: "12:00" },
  });
  assert.equal(rows.length, 1, "the retried request must not create a second row");
});

test("coupon usage limit: concurrent bookings can't both consume the last use", async () => {
  const [resultA, resultB] = await Promise.all([
    createAppointment(
      baseInput({ customerId: customerAId, requestedTime: "13:00", couponId }),
    ),
    createAppointment(
      baseInput({ customerId: customerBId, requestedTime: "14:00", couponId }),
    ),
  ]);

  const results = [resultA, resultB];
  for (const r of results) {
    if (r.ok) createdAppointmentIds.push(r.appointmentId);
  }

  const successes = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);

  assert.equal(successes.length, 1, "only one booking should consume the single-use coupon");
  assert.equal(!failures[0].ok && failures[0].reason, "COUPON_EXHAUSTED");

  const coupon = await db.coupon.findUniqueOrThrow({ where: { id: couponId } });
  assert.equal(coupon.usedCount, 1, "usedCount must not exceed usageLimit");
});
