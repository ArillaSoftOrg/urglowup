import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
import { createHmac } from "node:crypto";
import { config } from "dotenv";
import type { PrismaClient } from "@urglowup/db";
import type { GET as GetHandler, POST as PostHandler } from "./route";

// Same DATABASE_URL-for-Prisma-construction-only workaround used throughout
// this phase's whatsapp tests: the route transitively imports integration-store.ts
// (-> @/lib/db), which needs DATABASE_URL just to build the client, even
// though every test below stubs its query methods and never touches a real
// database — see integration-store.test.ts's doc comment for the full
// explanation (Prisma 7's getter-based delegate methods vs node:test's
// mock.method, dotenv + before()-deferred imports for apps/web's non-ESM
// top-level-await restriction).
let db: PrismaClient;
let GET: typeof GetHandler;
let POST: typeof PostHandler;

type PrismaCallArgs = { data: Record<string, unknown> };

before(async () => {
  config({ path: "./.env" });
  ({ db } = await import("@urglowup/db"));
  ({ GET, POST } = await import("./route"));
});

const ENV_KEYS = [
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_API_VERSION",
  "WHATSAPP_EXPECTED_PHONE_NUMBER",
  "WHATSAPP_SYSTEM_USER_ACCESS_TOKEN",
] as const;
const originalEnv: Record<string, string | undefined> = {};

const VERIFY_TOKEN = "test-verify-token";
const APP_SECRET = "test-app-secret-value";
const EXPECTED_PHONE = "+905551234567";
const SYSTEM_TOKEN = "system-user-secret-token";

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = VERIFY_TOKEN;
  process.env.WHATSAPP_APP_SECRET = APP_SECRET;
  process.env.WHATSAPP_EXPECTED_PHONE_NUMBER = EXPECTED_PHONE;
  delete process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  restoreFetch?.();
  restoreFetch = undefined;
  restoreConsole?.();
  restoreConsole = undefined;
});

let restoreFetch: (() => void) | undefined;
function mockFetch(impl: typeof fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  restoreFetch = () => {
    globalThis.fetch = original;
  };
}

let restoreConsole: (() => void) | undefined;
let capturedLogs: string[];
function captureConsole() {
  capturedLogs = [];
  const methods = ["log", "warn", "error"] as const;
  const originals = methods.map((m) => console[m]);
  for (const m of methods) {
    console[m] = (...args: unknown[]) => {
      capturedLogs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };
  }
  restoreConsole = () => {
    methods.forEach((m, i) => {
      console[m] = originals[i];
    });
  };
}

function sign(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

function postRequest(body: string, opts: { validSignature?: boolean; noSignature?: boolean } = {}): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!opts.noSignature) {
    headers["x-hub-signature-256"] = opts.validSignature === false ? "sha256=" + "0".repeat(64) : sign(body, APP_SECRET);
  }
  return new Request("https://urglowup.vercel.app/api/webhooks/whatsapp", {
    method: "POST",
    headers,
    body,
  });
}

function partnerAddedPayload(wabaId: string, ownerBusinessId: string | null): string {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: wabaId,
        changes: [
          {
            field: "account_update",
            value: {
              event: "PARTNER_ADDED",
              waba_id: wabaId,
              ...(ownerBusinessId ? { owner_business_id: ownerBusinessId } : {}),
            },
          },
        ],
      },
    ],
  });
}

function stubPrisma(overrides: {
  findUnique?: (args?: unknown) => unknown;
  create?: (args: PrismaCallArgs) => unknown;
  update?: (args: PrismaCallArgs) => unknown;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = db.whatsAppIntegration as any;
  if (overrides.findUnique) model.findUnique = overrides.findUnique;
  if (overrides.create) model.create = overrides.create;
  if (overrides.update) model.update = overrides.update;
}

// ─── GET verification ───────────────────────────────────────────────────

test("GET: correct verify token returns the challenge with 200", async () => {
  const req = new Request(
    `https://urglowup.vercel.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=12345`,
  );
  const res = await GET(req);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "12345");
});

test("GET: wrong verify token returns 403", async () => {
  const req = new Request(
    "https://urglowup.vercel.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345",
  );
  const res = await GET(req);
  assert.equal(res.status, 403);
});

test("GET: missing hub.challenge returns 403", async () => {
  const req = new Request(
    `https://urglowup.vercel.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}`,
  );
  const res = await GET(req);
  assert.equal(res.status, 403);
});

test("GET: missing WHATSAPP_WEBHOOK_VERIFY_TOKEN config returns 500", async () => {
  delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const req = new Request(
    "https://urglowup.vercel.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=x&hub.challenge=12345",
  );
  const res = await GET(req);
  assert.equal(res.status, 500);
});

// ─── POST signature verification ────────────────────────────────────────

test("POST: valid signature over a PARTNER_ADDED payload is accepted (200) and persists the WABA", async () => {
  let createCalled = false;
  stubPrisma({
    findUnique: async () => null,
    create: async (args: PrismaCallArgs) => {
      createCalled = true;
      assert.equal(args.data.wabaId, "waba-123");
      assert.equal(args.data.ownerBusinessId, "biz-456");
      assert.equal(args.data.status, "WABA_DISCOVERED");
      return { id: "waint_1" };
    },
  });

  const body = partnerAddedPayload("waba-123", "biz-456");
  const res = await POST(postRequest(body));

  assert.equal(res.status, 200);
  assert.equal(createCalled, true);
});

test("POST: invalid signature is rejected (401) and never touches the database", async () => {
  let dbTouched = false;
  stubPrisma({
    findUnique: async () => {
      dbTouched = true;
      return null;
    },
  });

  const body = partnerAddedPayload("waba-123", "biz-456");
  const res = await POST(postRequest(body, { validSignature: false }));

  assert.equal(res.status, 401);
  assert.equal(dbTouched, false);
});

test("POST: missing signature header is rejected (401)", async () => {
  const body = partnerAddedPayload("waba-123", "biz-456");
  const res = await POST(postRequest(body, { noSignature: true }));
  assert.equal(res.status, 401);
});

test("POST: malformed JSON (but validly signed) is rejected (400)", async () => {
  const body = "{not valid json";
  const res = await POST(postRequest(body));
  assert.equal(res.status, 400);
});

test("POST: missing WHATSAPP_APP_SECRET config returns 500 before touching the body", async () => {
  delete process.env.WHATSAPP_APP_SECRET;
  const res = await POST(postRequest(partnerAddedPayload("waba-123", "biz-456"), { noSignature: true }));
  assert.equal(res.status, 500);
});

// ─── PARTNER_ADDED handling ──────────────────────────────────────────────

test("POST: a payload with no recognized events (envelope valid, nothing to act on) returns 200 and touches nothing", async () => {
  let dbTouched = false;
  stubPrisma({
    findUnique: async () => {
      dbTouched = true;
      return null;
    },
  });

  const body = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "waba-1", changes: [] }] });
  const res = await POST(postRequest(body));

  assert.equal(res.status, 200);
  assert.equal(dbTouched, false);
});

test("POST: a structurally unexpected payload (wrong object) is rejected (400)", async () => {
  const body = JSON.stringify({ object: "page", entry: [] });
  const res = await POST(postRequest(body));
  assert.equal(res.status, 400);
});

test("POST: PARTNER_ADDED redelivery is idempotent — second delivery does not downgrade an already-PHONE_DISCOVERED row", async () => {
  let updateCallCount = 0;
  let statusInUpdate: unknown;
  stubPrisma({
    findUnique: async () => ({ status: "PHONE_DISCOVERED" }),
    update: async (args: PrismaCallArgs) => {
      updateCallCount += 1;
      statusInUpdate = args.data.status;
      return { id: "waint_1" };
    },
  });

  const body = partnerAddedPayload("waba-123", "biz-456");
  await POST(postRequest(body));
  await POST(postRequest(body));

  assert.equal(updateCallCount, 2); // recordWabaDiscovered still updates wabaId/ownerBusinessId each time
  assert.equal(statusInUpdate, undefined, "status must not be present in the update payload once already PHONE_DISCOVERED");
});

test("POST: PARTNER_ADDED with no owner_business_id in the payload still persists using entry.id for the WABA ID", async () => {
  let created: Record<string, unknown> | undefined;
  stubPrisma({
    findUnique: async () => null,
    create: async (args: PrismaCallArgs) => {
      created = args.data;
      return { id: "waint_1" };
    },
  });

  const body = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "waba-fallback", changes: [{ field: "account_update", value: { event: "PARTNER_ADDED" } }] }],
  });
  const res = await POST(postRequest(body));

  assert.equal(res.status, 200);
  assert.equal(created!.wabaId, "waba-fallback");
  assert.equal(created!.ownerBusinessId, null);
});

// ─── Phone number discovery, wired through the route ────────────────────

test("POST: after WABA discovery, an exact phone match records PHONE_DISCOVERED", async () => {
  process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN = SYSTEM_TOKEN;
  let phoneRecorded: Record<string, unknown> | undefined;
  stubPrisma({
    findUnique: async () => null,
    create: async () => ({ id: "waint_1" }),
    update: async (args: PrismaCallArgs) => {
      phoneRecorded = args.data;
      return { id: "waint_1" };
    },
  });
  mockFetch(async () =>
    new Response(JSON.stringify({ data: [{ id: "phone-1", display_phone_number: EXPECTED_PHONE }] }), {
      status: 200,
    }),
  );

  const res = await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  assert.equal(res.status, 200);
  assert.equal(phoneRecorded!.status, "PHONE_DISCOVERED");
  assert.equal(phoneRecorded!.phoneNumberId, "phone-1");
});

test("POST: zero phone matches marks FAILED with a safe reason, still returns 200", async () => {
  process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN = SYSTEM_TOKEN;
  let failedWith: Record<string, unknown> | undefined;
  stubPrisma({
    findUnique: async () => null,
    create: async () => ({ id: "waint_1" }),
    update: async (args: PrismaCallArgs) => {
      failedWith = args.data;
      return { id: "waint_1" };
    },
  });
  mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

  const res = await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  assert.equal(res.status, 200);
  assert.equal(failedWith!.status, "FAILED");
});

test("POST: multiple phone matches marks FAILED as ambiguous, does not auto-select, still returns 200", async () => {
  process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN = SYSTEM_TOKEN;
  let failedWith: Record<string, unknown> | undefined;
  stubPrisma({
    findUnique: async () => null,
    create: async () => ({ id: "waint_1" }),
    update: async (args: PrismaCallArgs) => {
      failedWith = args.data;
      return { id: "waint_1" };
    },
  });
  mockFetch(async () =>
    new Response(
      JSON.stringify({
        data: [
          { id: "phone-1", display_phone_number: EXPECTED_PHONE },
          { id: "phone-2", display_phone_number: EXPECTED_PHONE },
        ],
      }),
      { status: 200 },
    ),
  );

  const res = await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  assert.equal(res.status, 200);
  assert.equal(failedWith!.status, "FAILED");
  assert.match(String(failedWith!.lastError), /ambiguous/);
});

test("POST: phone discovery is skipped (not FAILED) when WHATSAPP_SYSTEM_USER_ACCESS_TOKEN is not configured", async () => {
  let updateCalled = false;
  stubPrisma({
    findUnique: async () => null,
    create: async () => ({ id: "waint_1" }),
    update: async () => {
      updateCalled = true;
      return { id: "waint_1" };
    },
  });

  const res = await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  assert.equal(res.status, 200);
  assert.equal(updateCalled, false, "no update call means status stayed WABA_DISCOVERED, not FAILED");
});

// ─── Security: nothing sensitive ever logged ─────────────────────────────

test("security: App Secret is never logged across GET/POST handling", async () => {
  captureConsole();
  stubPrisma({ findUnique: async () => null, create: async () => ({ id: "waint_1" }) });

  await GET(
    new Request("https://urglowup.vercel.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1"),
  );
  await POST(postRequest(partnerAddedPayload("waba-123", "biz-456"), { validSignature: false }));
  await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  const joined = capturedLogs.join("\n");
  assert.doesNotMatch(joined, new RegExp(APP_SECRET));
});

test("security: WHATSAPP_SYSTEM_USER_ACCESS_TOKEN is never logged", async () => {
  process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN = SYSTEM_TOKEN;
  captureConsole();
  stubPrisma({
    findUnique: async () => null,
    create: async () => ({ id: "waint_1" }),
    update: async () => ({ id: "waint_1" }),
  });
  mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

  await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  const joined = capturedLogs.join("\n");
  assert.doesNotMatch(joined, new RegExp(SYSTEM_TOKEN));
});

test("security: the full expected phone number is never logged (masked only)", async () => {
  process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN = SYSTEM_TOKEN;
  captureConsole();
  stubPrisma({
    findUnique: async () => null,
    create: async () => ({ id: "waint_1" }),
    update: async () => ({ id: "waint_1" }),
  });
  mockFetch(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));

  await POST(postRequest(partnerAddedPayload("waba-123", "biz-456")));

  const joined = capturedLogs.join("\n");
  assert.doesNotMatch(joined, new RegExp(EXPECTED_PHONE.replace("+", "\\+")));
});
