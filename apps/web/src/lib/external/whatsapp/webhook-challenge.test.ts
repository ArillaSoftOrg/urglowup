import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyWebhookChallenge } from "./webhook-challenge";

const VERIFY_TOKEN = "test-verify-token-value";

function params(overrides: Record<string, string>): URLSearchParams {
  return new URLSearchParams(overrides);
}

test("accepts a correct verify token and returns the challenge", () => {
  const result = verifyWebhookChallenge(
    params({ "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "12345" }),
    VERIFY_TOKEN,
  );
  assert.deepEqual(result, { ok: true, challenge: "12345" });
});

test("rejects a wrong verify token", () => {
  const result = verifyWebhookChallenge(
    params({ "hub.mode": "subscribe", "hub.verify_token": "wrong-token", "hub.challenge": "12345" }),
    VERIFY_TOKEN,
  );
  assert.deepEqual(result, { ok: false, reason: "token_mismatch" });
});

test("rejects a missing hub.challenge", () => {
  const result = verifyWebhookChallenge(
    params({ "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN }),
    VERIFY_TOKEN,
  );
  assert.deepEqual(result, { ok: false, reason: "missing_params" });
});

test("rejects a missing hub.verify_token", () => {
  const result = verifyWebhookChallenge(params({ "hub.mode": "subscribe", "hub.challenge": "12345" }), VERIFY_TOKEN);
  assert.deepEqual(result, { ok: false, reason: "missing_params" });
});

test("rejects a missing hub.mode", () => {
  const result = verifyWebhookChallenge(
    params({ "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "12345" }),
    VERIFY_TOKEN,
  );
  assert.deepEqual(result, { ok: false, reason: "missing_params" });
});

test("rejects a hub.mode other than subscribe", () => {
  const result = verifyWebhookChallenge(
    params({ "hub.mode": "unsubscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "12345" }),
    VERIFY_TOKEN,
  );
  assert.deepEqual(result, { ok: false, reason: "mode_mismatch" });
});

test("rejects a verify token of different length without throwing", () => {
  assert.doesNotThrow(() => {
    const result = verifyWebhookChallenge(
      params({ "hub.mode": "subscribe", "hub.verify_token": "short", "hub.challenge": "12345" }),
      VERIFY_TOKEN,
    );
    assert.deepEqual(result, { ok: false, reason: "token_mismatch" });
  });
});
