import assert from "node:assert/strict";
import { before, beforeEach, afterEach, test } from "node:test";
import { config } from "dotenv";
import type { PrismaClient } from "@urglowup/db";
import type {
  saveWhatsAppIntegration as SaveWhatsAppIntegration,
  recordWabaDiscovered as RecordWabaDiscovered,
  recordPhoneDiscovered as RecordPhoneDiscovered,
  markFailed as MarkFailed,
  markConnected as MarkConnected,
  getWhatsAppIntegrationStatus as GetWhatsAppIntegrationStatus,
  getDecryptedWhatsAppAccessToken as GetDecryptedWhatsAppAccessToken,
} from "./integration-store";

// This module (via @/lib/db) requires DATABASE_URL to be set just to
// *construct* the Prisma client — even though every test below stubs out
// the actual query methods and never touches a real database (this is a
// singleton table; upserting/deleting the real `primary` row from a test
// would be destructive to a real connected integration). Mirrors the
// apps/web/src/lib/api/dto.test.ts workaround: load .env via dotenv, then
// defer the real imports into before() (an async function body — apps/web
// isn't an ESM package, so top-level await isn't available here).
//
// Prisma 7's "prisma-client" generator exposes each model delegate's
// methods as accessor properties that return a freshly-bound function on
// every read (confirmed while writing Phase 1's version of this file) —
// incompatible with node:test's `mock.method`. Plain property assignment
// (`db.whatsAppIntegration.upsert = fn`) works fine instead.
let db: PrismaClient;
let saveWhatsAppIntegration: typeof SaveWhatsAppIntegration;
let recordWabaDiscovered: typeof RecordWabaDiscovered;
let recordPhoneDiscovered: typeof RecordPhoneDiscovered;
let markFailed: typeof MarkFailed;
let markConnected: typeof MarkConnected;
let getWhatsAppIntegrationStatus: typeof GetWhatsAppIntegrationStatus;
let getDecryptedWhatsAppAccessToken: typeof GetDecryptedWhatsAppAccessToken;

before(async () => {
  config({ path: "./.env" });

  ({ db } = await import("@urglowup/db"));
  ({
    saveWhatsAppIntegration,
    recordWabaDiscovered,
    recordPhoneDiscovered,
    markFailed,
    markConnected,
    getWhatsAppIntegrationStatus,
    getDecryptedWhatsAppAccessToken,
  } = await import("./integration-store"));
});

const TEST_ENCRYPTION_KEY = "a".repeat(64); // 32 bytes hex — valid AES-256-GCM key shape
const originalKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
});

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  } else {
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = originalKey;
  }
});

const PLAINTEXT_TOKEN = "EAABsecretlonglivedaccesstoken";

// ─── recordWabaDiscovered (PARTNER_ADDED first-write) ──────────────────────

test("recordWabaDiscovered creates a new row with status WABA_DISCOVERED when none exists", async () => {
  let capturedCreateData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).create = async (args: { data: Record<string, unknown> }) => {
    capturedCreateData = args.data;
    return { id: "waint_1" };
  };

  await recordWabaDiscovered({ wabaId: "waba-123", ownerBusinessId: "biz-456" });

  assert.equal(capturedCreateData?.status, "WABA_DISCOVERED");
  assert.equal(capturedCreateData?.wabaId, "waba-123");
  assert.equal(capturedCreateData?.ownerBusinessId, "biz-456");
  assert.equal(capturedCreateData?.singletonKey, "primary");
});

test("recordWabaDiscovered redelivery does NOT downgrade a PHONE_DISCOVERED row's status", async () => {
  let capturedUpdateData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => ({ status: "PHONE_DISCOVERED" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    capturedUpdateData = args.data;
    return { id: "waint_1" };
  };

  await recordWabaDiscovered({ wabaId: "waba-123", ownerBusinessId: "biz-456" });

  assert.equal(capturedUpdateData?.status, undefined, "status must not be touched when already PHONE_DISCOVERED");
  assert.equal(capturedUpdateData?.wabaId, "waba-123");
});

test("recordWabaDiscovered redelivery does NOT downgrade a CONNECTED row's status", async () => {
  let capturedUpdateData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => ({ status: "CONNECTED" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    capturedUpdateData = args.data;
    return { id: "waint_1" };
  };

  await recordWabaDiscovered({ wabaId: "waba-123", ownerBusinessId: "biz-456" });

  assert.equal(capturedUpdateData?.status, undefined);
});

test("recordWabaDiscovered resets a FAILED row back to WABA_DISCOVERED and clears lastError", async () => {
  let capturedUpdateData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => ({ status: "FAILED" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    capturedUpdateData = args.data;
    return { id: "waint_1" };
  };

  await recordWabaDiscovered({ wabaId: "waba-123", ownerBusinessId: "biz-456" });

  assert.equal(capturedUpdateData?.status, "WABA_DISCOVERED");
  assert.equal(capturedUpdateData?.lastError, null);
});

// ─── recordPhoneDiscovered / markFailed / markConnected ────────────────────

test("recordPhoneDiscovered sets status PHONE_DISCOVERED and clears lastError", async () => {
  let capturedData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    capturedData = args.data;
    return { id: "waint_1" };
  };

  await recordPhoneDiscovered({ phoneNumberId: "phone-1", displayPhoneNumber: "+905551234567" });

  assert.equal(capturedData?.status, "PHONE_DISCOVERED");
  assert.equal(capturedData?.phoneNumberId, "phone-1");
  assert.equal(capturedData?.lastError, null);
});

test("markFailed sets status FAILED with the given reason", async () => {
  let capturedData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    capturedData = args.data;
    return { id: "waint_1" };
  };

  await markFailed("ambiguous: 2 phone numbers matched");

  assert.equal(capturedData?.status, "FAILED");
  assert.equal(capturedData?.lastError, "ambiguous: 2 phone numbers matched");
});

test("markConnected sets status CONNECTED and clears lastError", async () => {
  let capturedData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    capturedData = args.data;
    return { id: "waint_1" };
  };

  await markConnected();

  assert.equal(capturedData?.status, "CONNECTED");
  assert.equal(capturedData?.lastError, null);
});

// ─── getWhatsAppIntegrationStatus ───────────────────────────────────────────

test("getWhatsAppIntegrationStatus never selects the encrypted token column", async () => {
  let capturedSelect: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async (args: { select: Record<string, unknown> }) => {
    capturedSelect = args.select;
    return {
      status: "PHONE_DISCOVERED",
      wabaId: "waba-123",
      ownerBusinessId: "biz-456",
      phoneNumberId: "phone-1",
      displayPhoneNumber: "+905551234567",
      lastError: null,
      connectedAt: new Date(),
      updatedAt: new Date(),
    };
  };

  const status = await getWhatsAppIntegrationStatus();

  assert.ok(status);
  assert.equal(status!.status, "PHONE_DISCOVERED");
  assert.ok(capturedSelect);
  assert.equal((capturedSelect as Record<string, unknown>).accessTokenEncrypted, undefined);
});

test("getWhatsAppIntegrationStatus returns null when no integration has been connected yet", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => null;
  const status = await getWhatsAppIntegrationStatus();
  assert.equal(status, null);
});

// ─── saveWhatsAppIntegration (reserved for the future JS-SDK flow) ─────────

test("saveWhatsAppIntegration encrypts the access token before writing to the DB — plaintext never reaches Prisma", async () => {
  let capturedCreateData: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).upsert = async (args: { create: Record<string, unknown> }) => {
    capturedCreateData = args.create;
    return { id: "waint_1", wabaId: args.create.wabaId, phoneNumberId: args.create.phoneNumberId };
  };

  await saveWhatsAppIntegration({
    wabaId: "waba-123",
    phoneNumberId: "phone-1",
    displayPhoneNumber: "+905551234567",
    accessTokenPlaintext: PLAINTEXT_TOKEN,
    tokenType: "long_lived_user_token",
  });

  assert.ok(capturedCreateData);
  const stored = capturedCreateData!.accessTokenEncrypted as string;
  assert.notEqual(stored, PLAINTEXT_TOKEN);
  assert.doesNotMatch(stored, new RegExp(PLAINTEXT_TOKEN));
  assert.equal(stored.split(":").length, 3);
});

test("saveWhatsAppIntegration upserts by the fixed singletonKey — never a per-tenant id", async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).upsert = async (args: { where: Record<string, unknown> }) => {
    capturedWhere = args.where;
    return { id: "waint_1", wabaId: "waba-123", phoneNumberId: "phone-1" };
  };

  await saveWhatsAppIntegration({
    wabaId: "waba-123",
    phoneNumberId: "phone-1",
    accessTokenPlaintext: PLAINTEXT_TOKEN,
  });

  assert.deepEqual(capturedWhere, { singletonKey: "primary" });
});

// ─── getDecryptedWhatsAppAccessToken ────────────────────────────────────────

test("getDecryptedWhatsAppAccessToken round-trips through encrypt/decrypt correctly", async () => {
  let stored: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).upsert = async (args: { create: Record<string, unknown> }) => {
    stored = args.create.accessTokenEncrypted as string;
    return { id: "waint_1", wabaId: "waba-123", phoneNumberId: "phone-1" };
  };

  await saveWhatsAppIntegration({
    wabaId: "waba-123",
    phoneNumberId: "phone-1",
    accessTokenPlaintext: PLAINTEXT_TOKEN,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => ({ accessTokenEncrypted: stored });

  const decrypted = await getDecryptedWhatsAppAccessToken();
  assert.equal(decrypted, PLAINTEXT_TOKEN);
});

test("getDecryptedWhatsAppAccessToken returns null when no integration exists", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => null;
  const decrypted = await getDecryptedWhatsAppAccessToken();
  assert.equal(decrypted, null);
});

test("getDecryptedWhatsAppAccessToken returns null when a row exists but has no token yet (normal hosted-flow state)", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).findUnique = async () => ({ accessTokenEncrypted: null });
  const decrypted = await getDecryptedWhatsAppAccessToken();
  assert.equal(decrypted, null);
});
