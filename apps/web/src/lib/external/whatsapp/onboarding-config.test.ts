import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getWhatsAppOnboardingConfig, WhatsAppOnboardingConfigError } from "./onboarding-config";

const ENV_KEYS = ["WHATSAPP_APP_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_REDIRECT_URI", "WHATSAPP_API_VERSION"] as const;
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

test("throws a configuration error naming missing variables when none are set", () => {
  assert.throws(
    () => getWhatsAppOnboardingConfig(),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppOnboardingConfigError);
      assert.match(err.message, /WHATSAPP_APP_ID/);
      assert.match(err.message, /WHATSAPP_APP_SECRET/);
      assert.match(err.message, /WHATSAPP_REDIRECT_URI/);
      return true;
    },
  );
});

test("names only the specific variables that are missing, not the ones present", () => {
  process.env.WHATSAPP_APP_ID = "test-app-id";
  process.env.WHATSAPP_REDIRECT_URI = "https://urglowup.vercel.app/api/integrations/whatsapp/callback";

  assert.throws(
    () => getWhatsAppOnboardingConfig(),
    (err: unknown) => {
      assert.ok(err instanceof WhatsAppOnboardingConfigError);
      assert.doesNotMatch(err.message, /WHATSAPP_APP_ID(?!_SECRET)/);
      assert.match(err.message, /WHATSAPP_APP_SECRET/);
      assert.doesNotMatch(err.message, /WHATSAPP_REDIRECT_URI/);
      return true;
    },
  );
});

test("never includes variable values in the error message — only names", () => {
  process.env.WHATSAPP_APP_ID = "super-secret-app-id-value";
  process.env.WHATSAPP_APP_SECRET = "super-secret-app-secret-value";

  assert.throws(
    () => getWhatsAppOnboardingConfig(),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.doesNotMatch(err.message, /super-secret-app-id-value/);
      assert.doesNotMatch(err.message, /super-secret-app-secret-value/);
      return true;
    },
  );
});

test("returns the full config with a default apiVersion when all required vars are set", () => {
  process.env.WHATSAPP_APP_ID = "app-id";
  process.env.WHATSAPP_APP_SECRET = "app-secret";
  process.env.WHATSAPP_REDIRECT_URI = "https://urglowup.vercel.app/api/integrations/whatsapp/callback";

  const config = getWhatsAppOnboardingConfig();
  assert.equal(config.appId, "app-id");
  assert.equal(config.appSecret, "app-secret");
  assert.equal(config.redirectUri, "https://urglowup.vercel.app/api/integrations/whatsapp/callback");
  assert.equal(config.apiVersion, "v21.0");
});

test("honors WHATSAPP_API_VERSION when explicitly set", () => {
  process.env.WHATSAPP_APP_ID = "app-id";
  process.env.WHATSAPP_APP_SECRET = "app-secret";
  process.env.WHATSAPP_REDIRECT_URI = "https://urglowup.vercel.app/api/integrations/whatsapp/callback";
  process.env.WHATSAPP_API_VERSION = "v23.0";

  const config = getWhatsAppOnboardingConfig();
  assert.equal(config.apiVersion, "v23.0");
});
