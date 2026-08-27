import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { config } from "dotenv";
import type { PrismaClient } from "@urglowup/db";
import type {
  subscribeAppToWaba as SubscribeAppToWaba,
  ensureSubscribedToWaba as EnsureSubscribedToWaba,
  WhatsAppSubscriptionError as WhatsAppSubscriptionErrorType,
} from "./subscription";
import type { WhatsAppOnboardingConfig } from "./onboarding-config";

// Same DATABASE_URL-for-construction-only workaround as integration-store.test.ts
// — ensureSubscribedToWaba() calls markConnected() internally, which needs
// @/lib/db to be importable, even though we stub its Prisma methods.
let db: PrismaClient;
let subscribeAppToWaba: typeof SubscribeAppToWaba;
let ensureSubscribedToWaba: typeof EnsureSubscribedToWaba;
let WhatsAppSubscriptionError: typeof WhatsAppSubscriptionErrorType;

before(async () => {
  config({ path: "./.env" });
  ({ db } = await import("@urglowup/db"));
  ({ subscribeAppToWaba, ensureSubscribedToWaba, WhatsAppSubscriptionError } = await import("./subscription"));
});

afterEach(() => {
  mockRestore();
});

let fetchMockRestore: (() => void) | undefined;
function mockFetch(impl: typeof fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  fetchMockRestore = () => {
    globalThis.fetch = original;
  };
}
function mockRestore() {
  fetchMockRestore?.();
  fetchMockRestore = undefined;
}

const CONFIG: WhatsAppOnboardingConfig = {
  appId: "test-app-id",
  appSecret: "test-app-secret",
  redirectUri: "https://urglowup.vercel.app/api/integrations/whatsapp/callback",
  apiVersion: "v21.0",
};
const ACCESS_TOKEN = "system-user-token-value";

test("subscribeAppToWaba POSTs to /{WABA-ID}/subscribed_apps with a bearer token", async () => {
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;
  mockFetch(async (url, init) => {
    capturedUrl = url as string;
    capturedInit = init;
    return new Response("{}", { status: 200 });
  });

  await subscribeAppToWaba(CONFIG, "waba-123", ACCESS_TOKEN);

  assert.equal(capturedUrl, "https://graph.facebook.com/v21.0/waba-123/subscribed_apps");
  assert.equal(capturedInit?.method, "POST");
  assert.equal((capturedInit?.headers as Record<string, string>).Authorization, `Bearer ${ACCESS_TOKEN}`);
});

test("subscribeAppToWaba throws WhatsAppSubscriptionError on a non-OK response", async () => {
  mockFetch(async () => new Response("{}", { status: 403 }));
  await assert.rejects(() => subscribeAppToWaba(CONFIG, "waba-123", ACCESS_TOKEN), WhatsAppSubscriptionError);
});

test("subscribeAppToWaba throws WhatsAppSubscriptionError on a network failure", async () => {
  mockFetch(async () => {
    throw new Error("ECONNRESET");
  });
  await assert.rejects(() => subscribeAppToWaba(CONFIG, "waba-123", ACCESS_TOKEN), WhatsAppSubscriptionError);
});

test("ensureSubscribedToWaba calls markConnected only after subscription succeeds", async () => {
  let markConnectedCalled = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async (args: { data: Record<string, unknown> }) => {
    markConnectedCalled = true;
    assert.equal(args.data.status, "CONNECTED");
    return { id: "waint_1" };
  };
  mockFetch(async () => new Response("{}", { status: 200 }));

  await ensureSubscribedToWaba(CONFIG, "waba-123", ACCESS_TOKEN);

  assert.equal(markConnectedCalled, true);
});

test("ensureSubscribedToWaba does NOT call markConnected when the subscription call fails", async () => {
  let markConnectedCalled = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db.whatsAppIntegration as any).update = async () => {
    markConnectedCalled = true;
    return { id: "waint_1" };
  };
  mockFetch(async () => new Response("{}", { status: 500 }));

  await assert.rejects(() => ensureSubscribedToWaba(CONFIG, "waba-123", ACCESS_TOKEN));
  assert.equal(markConnectedCalled, false);
});
