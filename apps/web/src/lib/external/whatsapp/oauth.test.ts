import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { exchangeCodeForShortLivedToken, exchangeForLongLivedToken, WhatsAppOAuthError } from "./oauth";
import type { WhatsAppOnboardingConfig } from "./onboarding-config";

const CONFIG: WhatsAppOnboardingConfig = {
  appId: "test-app-id",
  appSecret: "test-app-secret-value",
  redirectUri: "https://urglowup.vercel.app/api/integrations/whatsapp/callback",
  apiVersion: "v21.0",
};

const SECRET_CODE = "one-time-authorization-code-abc123";
const SECRET_ACCESS_TOKEN = "EAABsecretaccesstokenvalue";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  mock.restoreAll();
});

test("exchangeCodeForShortLivedToken returns the access token on success", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({ access_token: SECRET_ACCESS_TOKEN, token_type: "bearer" }));

  const result = await exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE);
  assert.equal(result.access_token, SECRET_ACCESS_TOKEN);
});

test("exchangeCodeForShortLivedToken sends credentials as query params on a GET request", async () => {
  let capturedUrl: string | undefined;
  let capturedMethod: string | undefined;
  mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    capturedUrl = url;
    capturedMethod = init?.method;
    return jsonResponse({ access_token: SECRET_ACCESS_TOKEN });
  });

  await exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE);

  assert.equal(capturedMethod, "GET");
  assert.ok(capturedUrl?.startsWith("https://graph.facebook.com/v21.0/oauth/access_token?"));
  const params = new URL(capturedUrl!).searchParams;
  assert.equal(params.get("client_id"), CONFIG.appId);
  assert.equal(params.get("client_secret"), CONFIG.appSecret);
  assert.equal(params.get("redirect_uri"), CONFIG.redirectUri);
  assert.equal(params.get("code"), SECRET_CODE);
});

test("throws invalid_grant on a 400 OAuthException response (replayed/expired code)", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({ error: { type: "OAuthException", code: 100, message: "should never appear in our error" } }, 400),
  );

  await assert.rejects(
    () => exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppOAuthError);
      assert.equal(err.code, "invalid_grant");
      return true;
    },
  );
});

test("throws exchange_failed on a non-400 error status", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({ error: { type: "ServerException" } }, 500));

  await assert.rejects(
    () => exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppOAuthError);
      assert.equal(err.code, "exchange_failed");
      return true;
    },
  );
});

test("throws network_error when fetch itself rejects", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new Error("ECONNRESET");
  });

  await assert.rejects(
    () => exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppOAuthError);
      assert.equal(err.code, "network_error");
      return true;
    },
  );
});

test("throws exchange_failed when the response is missing access_token", async () => {
  mock.method(globalThis, "fetch", async () => jsonResponse({ token_type: "bearer" }));

  await assert.rejects(
    () => exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppOAuthError);
      assert.equal(err.code, "exchange_failed");
      return true;
    },
  );
});

test("never includes the authorization code or access token in a thrown error message", async () => {
  mock.method(globalThis, "fetch", async () =>
    jsonResponse({ error: { type: "OAuthException", code: 100 } }, 400),
  );

  try {
    await exchangeCodeForShortLivedToken(CONFIG, SECRET_CODE);
    assert.fail("expected exchangeCodeForShortLivedToken to throw");
  } catch (err) {
    assert.ok(err instanceof Error);
    assert.doesNotMatch(err.message, new RegExp(SECRET_CODE));
    assert.doesNotMatch(err.message, new RegExp(SECRET_ACCESS_TOKEN));
    assert.doesNotMatch(err.message, new RegExp(CONFIG.appSecret));
  }
});

test("exchangeForLongLivedToken uses grant_type=fb_exchange_token", async () => {
  let capturedUrl: string | undefined;
  mock.method(globalThis, "fetch", async (url: string) => {
    capturedUrl = url;
    return jsonResponse({ access_token: "long-lived-token-value", expires_in: 5184000 });
  });

  const result = await exchangeForLongLivedToken(CONFIG, SECRET_ACCESS_TOKEN);

  assert.equal(result.access_token, "long-lived-token-value");
  const params = new URL(capturedUrl!).searchParams;
  assert.equal(params.get("grant_type"), "fb_exchange_token");
  assert.equal(params.get("fb_exchange_token"), SECRET_ACCESS_TOKEN);
});
