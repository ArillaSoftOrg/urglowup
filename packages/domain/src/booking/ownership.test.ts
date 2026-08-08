import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });

const { db } = await import("@urglowup/db");
const { createAppointment } = await import("./create-appointment");
const { getAppointmentById, listCustomerAppointments } = await import("./queries");
const { cancelAppointment } = await import("./cancel-appointment");
const { rescheduleAppointment } = await import("./reschedule-appointment");

// IDOR regression coverage: a customer must never be able to read, cancel, or
// reschedule another customer's appointment via these domain functions (the
// same functions /api/v1/appointments/* calls).

let businessId: string;
let serviceId: string;
let ownerId: string;
let strangerId: string;
let appointmentId: string;

before(async () => {
  const suffix = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const business = await db.business.create({
    data: { name: `Ownership Test Business ${suffix}`, slug: `biz-own-${suffix}` },
  });
  businessId = business.id;

  const service = await db.businessService.create({
    data: {
      businessId,
      name: "Test Service",
      slug: `service-own-${suffix}`,
      durationMinutes: 30,
      price: 100,
    },
  });
  serviceId = service.id;

  const owner = await db.user.create({ data: { email: `owner-${suffix}@example.test` } });
  ownerId = owner.id;
  const stranger = await db.user.create({ data: { email: `stranger-${suffix}@example.test` } });
  strangerId = stranger.id;

  const creation = await createAppointment({
    businessId,
    customerId: ownerId,
    primaryServiceId: serviceId,
    primaryProfessionalId: null,
    couponId: null,
    discountAmount: null,
    requestedDate: "2027-02-01",
    requestedTime: "09:00",
    customerNote: null,
    firstVisit: null,
    isGroup: false,
    guestCount: 1,
    totalDurationMinutes: 30,
    totalPrice: 100,
    items: [
      { guestName: "Ben", guestIndex: 0, serviceId, professionalId: null, durationMinutes: 30, priceSnapshot: 100 },
    ],
  });
  assert.ok(creation.ok, "fixture appointment creation must succeed");
  appointmentId = creation.appointmentId;
});

after(async () => {
  await db.appointment.deleteMany({ where: { id: appointmentId } });
  await db.businessService.delete({ where: { id: serviceId } }).catch(() => {});
  await db.business.delete({ where: { id: businessId } }).catch(() => {});
  await db.user.delete({ where: { id: ownerId } }).catch(() => {});
  await db.user.delete({ where: { id: strangerId } }).catch(() => {});
  await db.$disconnect();
});

test("getAppointmentById: a stranger gets NOT_FOUND, not the owner's data", async () => {
  const asStranger = await getAppointmentById(strangerId, appointmentId);
  assert.equal(asStranger.ok, false);
  assert.equal(!asStranger.ok && asStranger.reason, "NOT_FOUND");

  const asOwner = await getAppointmentById(ownerId, appointmentId);
  assert.equal(asOwner.ok, true);
});

test("cancelAppointment: a stranger cannot cancel another customer's appointment", async () => {
  const result = await cancelAppointment(strangerId, appointmentId, "not mine");
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.reason, "NOT_FOUND");

  const stillPending = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });
  assert.equal(stillPending?.status, "PENDING", "stranger's cancel attempt must not mutate the row");
});

test("rescheduleAppointment: a stranger cannot reschedule another customer's appointment", async () => {
  const result = await rescheduleAppointment(strangerId, appointmentId, "2027-02-02", "10:00");
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.reason, "NOT_FOUND");
});

test("listCustomerAppointments: a customer only sees their own appointments", async () => {
  const strangerList = await listCustomerAppointments(strangerId, { limit: 20 });
  assert.ok(
    !strangerList.data.some((a) => a.id === appointmentId),
    "the owner's appointment must not appear in a stranger's list",
  );

  const ownerList = await listCustomerAppointments(ownerId, { limit: 20 });
  assert.ok(ownerList.data.some((a) => a.id === appointmentId));
});
