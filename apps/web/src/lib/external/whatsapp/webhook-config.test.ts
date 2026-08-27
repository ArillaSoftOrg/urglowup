import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getWhatsAppWebhookConfig, WhatsAppWebhookConfigError } from "./webhook-config";

const ENV_KEYS = [
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_API_VERSION",
  "WHATSAPP_EXPECTED_PHONE_NUMBER",
  "WHATSAPP_SYSTEM_USER_ACCESS_TOKEN",
] as const;
const originalValues: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalValues[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalValues[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValues[key];
    }
  }
});

test("throws naming missing required variables when none are set", () => {
  assert.throws(
    () => getWhatsAppWebhookConfig(),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppWebhookConfigError);
      assert.match(err.message, /WHATSAPP_APP_SECRET/);
      assert.match(err.message, /WHATSAPP_WEBHOOK_VERIFY_TOKEN/);
      assert.match(err.message, /WHATSAPP_EXPECTED_PHONE_NUMBER/);
      return true;
    },
  );
});

test("never includes variable values in the error message", () => {
  process.env.WHATSAPP_APP_SECRET = "super-secret-value";
  assert.throws(
    () => getWhatsAppWebhookConfig(),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.doesNotMatch(err.message, /super-secret-value/);
      return true;
    },
  );
});

test("throws a distinct error when WHATSAPP_EXPECTED_PHONE_NUMBER is set but not normalizable", () => {
  process.env.WHATSAPP_APP_SECRET = "secret";
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "token";
  process.env.WHATSAPP_EXPECTED_PHONE_NUMBER = "not-a-phone-number";

  assert.throws(
    () => getWhatsAppWebhookConfig(),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppWebhookConfigError);
      assert.match(err.message, /normalizable/);
      return true;
    },
  );
});

test("returns a valid config, normalizing the expected phone number, with systemUserAccessToken undefined when unset", () => {
  process.env.WHATSAPP_APP_SECRET = "secret";
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "token";
  process.env.WHATSAPP_EXPECTED_PHONE_NUMBER = "0555 123 45 67";

  const config = getWhatsAppWebhookConfig();
  assert.equal(config.appSecret, "secret");
  assert.equal(config.webhookVerifyToken, "token");
  assert.equal(config.expectedPhoneNumber, "+905551234567");
  assert.equal(config.apiVersion, "v21.0");
  assert.equal(config.systemUserAccessToken, undefined);
});

test("includes systemUserAccessToken when set", () => {
  process.env.WHATSAPP_APP_SECRET = "secret";
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "token";
  process.env.WHATSAPP_EXPECTED_PHONE_NUMBER = "+905551234567";
  process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN = "system-user-token-value";

  const config = getWhatsAppWebhookConfig();
  assert.equal(config.systemUserAccessToken, "system-user-token-value");
});
