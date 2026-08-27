import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { discoverWabaId, findExpectedWhatsAppPhoneNumber, WhatsAppDiscoveryError } from "./discovery";
import type { WhatsAppOnboardingConfig } from "./onboarding-config";

const CONFIG: WhatsAppOnboardingConfig = {
  appId: "test-app-id",
  appSecret: "test-app-secret-value",
  redirectUri: "https://urglowup.vercel.app/api/integrations/whatsapp/callback",
  apiVersion: "v21.0",
};

const USER_ACCESS_TOKEN = "EAABsecretuseraccesstoken";
const EXPECTED_PHONE = "+905551234567";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  mock.restoreAll();
});

// ─── discoverWabaId (standard embedded signup OAuth discovery) ────────────

test("discoverWabaId returns the target_id under the whatsapp_business_management scope", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({
      data: {
        is_valid: true,
        granular_scopes: [
          { scope: "business_management", target_ids: ["999"] },
          { scope: "whatsapp_business_management", target_ids: ["waba-123"] },
        ],
      },
    }),
  );

  const wabaId = await discoverWabaId(CONFIG, USER_ACCESS_TOKEN);
  assert.equal(wabaId, "waba-123");
});

test("discoverWabaId uses an app access token (appId|appSecret) to inspect the user token", async () => {
  let capturedUrl: string | undefined;
  mock.method(globalThis, "fetch", async (url: string) => {
    capturedUrl = url;
    return jsonResponse({
      data: { granular_scopes: [{ scope: "whatsapp_business_management", target_ids: ["waba-123"] }] },
    });
  });

  await discoverWabaId(CONFIG, USER_ACCESS_TOKEN);

  const params = new URL(capturedUrl!).searchParams;
  assert.equal(params.get("input_token"), USER_ACCESS_TOKEN);
  assert.equal(params.get("access_token"), `${CONFIG.appId}|${CONFIG.appSecret}`);
});

test("discoverWabaId throws when no whatsapp_business_management scope is present", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({ data: { granular_scopes: [{ scope: "business_management", target_ids: ["999"] }] } }),
  );

  await assert.rejects(() => discoverWabaId(CONFIG, USER_ACCESS_TOKEN), WhatsAppDiscoveryError);
});

test("discoverWabaId throws on a non-OK response", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({}, 500));

  await assert.rejects(() => discoverWabaId(CONFIG, USER_ACCESS_TOKEN), WhatsAppDiscoveryError);
});

// ─── findExpectedWhatsAppPhoneNumber ───────────────────────────────────────

test("findExpectedWhatsAppPhoneNumber matches by number, exact single match", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({
      data: [{ id: "phone-1", display_phone_number: "+90 555 123 45 67", verified_name: "Urglowup" }],
    }),
  );

  const result = await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);

  assert.deepEqual(result, {
    status: "matched",
    phoneNumberId: "phone-1",
    displayPhoneNumber: "+90 555 123 45 67",
  });
});

test("findExpectedWhatsAppPhoneNumber normalizes formatting differences before comparing", async () => {
  // Same number as EXPECTED_PHONE but with 0-prefixed local format and punctuation
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({ data: [{ id: "phone-1", display_phone_number: "0555-123-45-67" }] }),
  );

  const result = await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);
  assert.equal(result.status, "matched");
});

test("findExpectedWhatsAppPhoneNumber returns not_found when zero numbers match", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({ data: [{ id: "phone-1", display_phone_number: "+905559999999" }] }),
  );

  const result = await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);
  assert.deepEqual(result, { status: "not_found" });
});

test("findExpectedWhatsAppPhoneNumber returns not_found when the WABA has no registered numbers at all", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({ data: [] }));

  const result = await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);
  assert.deepEqual(result, { status: "not_found" });
});

test("findExpectedWhatsAppPhoneNumber returns ambiguous when more than one number matches", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({
      data: [
        { id: "phone-1", display_phone_number: "+905551234567" },
        { id: "phone-2", display_phone_number: "+905551234567" },
      ],
    }),
  );

  const result = await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);
  assert.deepEqual(result, { status: "ambiguous", matchCount: 2 });
});

test("findExpectedWhatsAppPhoneNumber picks the CORRECT match even when it is not the first record (no first-record fallback)", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({
      data: [
        { id: "phone-wrong", display_phone_number: "+905559999999" },
        { id: "phone-correct", display_phone_number: "+905551234567" },
      ],
    }),
  );

  const result = await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);

  assert.equal(result.status, "matched");
  assert.equal((result as { phoneNumberId: string }).phoneNumberId, "phone-correct");
});

test("findExpectedWhatsAppPhoneNumber throws WhatsAppDiscoveryError on a non-OK response (transport failure, distinct from not_found)", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({}, 500));

  await assert.rejects(
    () => findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE),
    WhatsAppDiscoveryError,
  );
});

test("findExpectedWhatsAppPhoneNumber never logs the full phone number — masked only", async () => {
  const originalWarn = console.warn;
  const logged: string[] = [];
  console.warn = (...args: unknown[]) => {
    logged.push(args.map(String).join(" "));
  };
  try {
    mock.method(globalThis, "fetch", async () => jsonResponse({ data: [] }));
    await findExpectedWhatsAppPhoneNumber(CONFIG.apiVersion, "waba-123", USER_ACCESS_TOKEN, EXPECTED_PHONE);
  } finally {
    console.warn = originalWarn;
  }

  const joined = logged.join("\n");
  assert.doesNotMatch(joined, new RegExp(EXPECTED_PHONE.replace("+", "\\+")));
});
