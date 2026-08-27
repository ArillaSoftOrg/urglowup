import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { verifyWhatsAppWebhookSignature } from "./webhook-signature";

const APP_SECRET = "test-app-secret-value";
const BODY = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

function sign(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

test("accepts a correctly signed body", () => {
  const header = sign(BODY, APP_SECRET);
  assert.equal(verifyWhatsAppWebhookSignature(BODY, header, APP_SECRET), true);
});

test("rejects when the signature was computed with a different secret", () => {
  const header = sign(BODY, "wrong-secret");
  assert.equal(verifyWhatsAppWebhookSignature(BODY, header, APP_SECRET), false);
});

test("rejects when the body was tampered with after signing", () => {
  const header = sign(BODY, APP_SECRET);
  const tamperedBody = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "injected" }] });
  assert.equal(verifyWhatsAppWebhookSignature(tamperedBody, header, APP_SECRET), false);
});

test("rejects a missing signature header", () => {
  assert.equal(verifyWhatsAppWebhookSignature(BODY, null, APP_SECRET), false);
  assert.equal(verifyWhatsAppWebhookSignature(BODY, undefined, APP_SECRET), false);
  assert.equal(verifyWhatsAppWebhookSignature(BODY, "", APP_SECRET), false);
});

test("rejects a header missing the sha256= prefix", () => {
  const raw = createHmac("sha256", APP_SECRET).update(BODY, "utf8").digest("hex");
  assert.equal(verifyWhatsAppWebhookSignature(BODY, raw, APP_SECRET), false);
});

test("rejects a malformed (non-hex) signature without throwing", () => {
  assert.doesNotThrow(() => {
    const result = verifyWhatsAppWebhookSignature(BODY, "sha256=not-hex-at-all!!", APP_SECRET);
    assert.equal(result, false);
  });
});

test("rejects a truncated signature without throwing (length mismatch)", () => {
  const header = sign(BODY, APP_SECRET);
  const truncated = header.slice(0, header.length - 10);
  assert.doesNotThrow(() => {
    assert.equal(verifyWhatsAppWebhookSignature(BODY, truncated, APP_SECRET), false);
  });
});

test("rejects an empty-hex signature", () => {
  assert.equal(verifyWhatsAppWebhookSignature(BODY, "sha256=", APP_SECRET), false);
});
