import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });

const { db } = await import("@urglowup/db");
const { createAppointment } = await import("../booking/create-appointment");
const { deleteAccount } = await import("./delete-account");

let userId: string;
let businessId: string;
let serviceId: string;
let futureAppointmentId: string;

before(async () => {
  const suffix = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const user = await db.user.create({
    data: { email: `delete-me-${suffix}@example.test`, firstName: "Del", lastName: "Ete" },
  });
  userId = user.id;

  // A session + an OAuth account row, so we can verify both get revoked.
  await db.session.create({
    data: {
      userId,
      token: `session-token-${suffix}`,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  await db.account.create({
    data: {
      userId,
      providerId: "google",
      accountId: `google-${suffix}`,
    },
  });

  const business = await db.business.create({
    data: { name: `Delete Test Business ${suffix}`, slug: `biz-del-${suffix}` },
  });
  businessId = business.id;

  const service = await db.businessService.create({
    data: { businessId, name: "Test Service", slug: `service-del-${suffix}`, durationMinutes: 30, price: 100 },
  });
  serviceId = service.id;

  const creation = await createAppointment({
    businessId,
    customerId: userId,
    primaryServiceId: serviceId,
    primaryProfessionalId: null,
    couponId: null,
    discountAmount: null,
    requestedDate: "2027-03-01",
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
  assert.ok(creation.ok);
  futureAppointmentId = creation.appointmentId;
});

after(async () => {
  await db.appointment.deleteMany({ where: { id: futureAppointmentId } });
  await db.businessService.delete({ where: { id: serviceId } }).catch(() => {});
  await db.business.delete({ where: { id: businessId } }).catch(() => {});
  await db.user.delete({ where: { id: userId } }).catch(() => {});
  await db.$disconnect();
});

test("deleteAccount anonymizes PII, revokes sessions/OAuth, and cancels future bookings", async () => {
  const result = await deleteAccount(userId);
  assert.equal(result.ok, true);

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  assert.ok(user.deletedAt);
  assert.equal(user.firstName, null);
  assert.equal(user.lastName, null);
  assert.match(user.email, /^deleted-.*@deleted\.urglowup\.invalid$/);

  const sessions = await db.session.findMany({ where: { userId } });
  assert.equal(sessions.length, 0);

  const accounts = await db.account.findMany({ where: { userId } });
  assert.equal(accounts.length, 0);

  const appointment = await db.appointment.findUniqueOrThrow({ where: { id: futureAppointmentId } });
  assert.equal(appointment.status, "CANCELLED_BY_CUSTOMER");
});

test("deleteAccount is not re-runnable on an already-deleted account", async () => {
  const result = await deleteAccount(userId);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.reason, "ALREADY_DELETED");
});
