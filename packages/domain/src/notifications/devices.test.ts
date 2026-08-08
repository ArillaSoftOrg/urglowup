import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });

const { db } = await import("@urglowup/db");
const { registerDevice, removeDevice, listDeviceTokensForUser, removeDeviceTokensByValue } = await import(
  "./devices"
);

let userId: string;
let strangerId: string;

before(async () => {
  const suffix = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user = await db.user.create({ data: { email: `device-owner-${suffix}@example.test` } });
  userId = user.id;
  const stranger = await db.user.create({ data: { email: `device-stranger-${suffix}@example.test` } });
  strangerId = stranger.id;
});

after(async () => {
  await db.deviceToken.deleteMany({ where: { userId: { in: [userId, strangerId] } } });
  await db.user.deleteMany({ where: { id: { in: [userId, strangerId] } } });
  await db.$disconnect();
});

test("registerDevice upserts by token and a stranger cannot remove it", async () => {
  const token = `ExponentPushToken[test-${Date.now()}]`;

  const first = await registerDevice({ userId, expoPushToken: token, platform: "ios" });
  const second = await registerDevice({ userId, expoPushToken: token, platform: "ios" });
  assert.equal(first.id, second.id, "re-registering the same token must not create a duplicate row");

  const strangerRemoval = await removeDevice(strangerId, first.id);
  assert.equal(strangerRemoval.ok, false);
  assert.equal(!strangerRemoval.ok && strangerRemoval.reason, "NOT_FOUND");

  const tokens = await listDeviceTokensForUser(userId);
  assert.ok(tokens.includes(token));

  const ownerRemoval = await removeDevice(userId, first.id);
  assert.equal(ownerRemoval.ok, true);

  const tokensAfter = await listDeviceTokensForUser(userId);
  assert.ok(!tokensAfter.includes(token));
});

test("removeDeviceTokensByValue prunes by token value (invalid-token cleanup path)", async () => {
  const token = `ExponentPushToken[prune-${Date.now()}]`;
  await registerDevice({ userId, expoPushToken: token, platform: "android" });

  await removeDeviceTokensByValue([token]);

  const tokens = await listDeviceTokensForUser(userId);
  assert.ok(!tokens.includes(token));
});
