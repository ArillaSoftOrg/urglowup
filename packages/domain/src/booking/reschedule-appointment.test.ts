import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });

const { db } = await import("@urglowup/db");
const { rescheduleAppointment } = await import("./reschedule-appointment");
const { getDayOfWeek } = await import("./constants");

// Integration test against a real database (see DATABASE_URL) — this suite
// creates its own throwaway fixtures and deletes them afterwards. It does
// not touch any pre-existing rows.

const TARGET_DATE = "2027-02-20";
const TARGET_TIME = "15:00";

let businessId: string;
let serviceId: string;
let customerAId: string;
let customerBId: string;
let appointmentAId: string;
let appointmentBId: string;
const createdAppointmentIds: string[] = [];

before(async () => {
  const suffix = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const business = await db.business.create({
    data: { name: `Reschedule Concurrency Test ${suffix}`, slug: `biz-${suffix}` },
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

  await db.businessHour.create({
    data: {
      businessId,
      dayOfWeek: getDayOfWeek(TARGET_DATE),
      isOpen: true,
      openTime: "09:00",
      closeTime: "20:00",
    },
  });

  const customerA = await db.user.create({
    data: { email: `customer-a-${suffix}@example.test` },
  });
  customerAId = customerA.id;

  const customerB = await db.user.create({
    data: { email: `customer-b-${suffix}@example.test` },
  });
  customerBId = customerB.id;

  // Two pre-existing, independently-scheduled appointments (different
  // original slots) that the test will then race to reschedule INTO the
  // same target slot.
  const appointmentA = await db.appointment.create({
    data: {
      businessId,
      customerId: customerAId,
      serviceId,
      requestedDate: new Date("2027-02-18"),
      requestedTime: "10:00",
      status: "CONFIRMED",
      totalDurationMinutes: 30,
    },
  });
  appointmentAId = appointmentA.id;
  createdAppointmentIds.push(appointmentAId);

  const appointmentB = await db.appointment.create({
    data: {
      businessId,
      customerId: customerBId,
      serviceId,
      requestedDate: new Date("2027-02-19"),
      requestedTime: "10:00",
      status: "CONFIRMED",
      totalDurationMinutes: 30,
    },
  });
  appointmentBId = appointmentB.id;
  createdAppointmentIds.push(appointmentBId);
});

after(async () => {
  if (createdAppointmentIds.length > 0) {
    await db.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (businessId) {
    await db.businessHour.deleteMany({ where: { businessId } }).catch(() => {});
    await db.businessService.delete({ where: { id: serviceId } }).catch(() => {});
    await db.business.delete({ where: { id: businessId } }).catch(() => {});
  }
  if (customerAId) await db.user.delete({ where: { id: customerAId } }).catch(() => {});
  if (customerBId) await db.user.delete({ where: { id: customerBId } }).catch(() => {});
  await db.$disconnect();
});

test("two concurrent reschedules into the same slot: exactly one succeeds, the other gets a clean CONFLICT", async () => {
  const [resultA, resultB] = await Promise.all([
    rescheduleAppointment(customerAId, appointmentAId, TARGET_DATE, TARGET_TIME),
    rescheduleAppointment(customerBId, appointmentBId, TARGET_DATE, TARGET_TIME),
  ]);

  const results = [resultA, resultB];
  const successes = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);

  assert.equal(successes.length, 1, "exactly one of the two concurrent reschedules should succeed");
  assert.equal(failures.length, 1);
  assert.equal(
    !failures[0].ok && failures[0].reason,
    "CONFLICT",
    "the loser must get a clean domain CONFLICT reason, never an unhandled exception",
  );

  const rows = await db.appointment.findMany({
    where: { businessId, requestedDate: new Date(TARGET_DATE), requestedTime: TARGET_TIME },
  });
  assert.equal(rows.length, 1, "only one appointment should end up occupying the contested slot");
});
