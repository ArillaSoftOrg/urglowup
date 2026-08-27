/**
 * Server-side configuration for the Meta-hosted Coexistence webhook flow
 * (GET verification + POST account_update/PARTNER_ADDED handling).
 *
 * Distinct from ./onboarding-config.ts, which is scoped to the (not-yet-used
 * in this phase) JS-SDK OAuth code-exchange flow. This module's config is
 * what the Meta-hosted "Generate link" flow actually needs.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import { normalizeTurkishPhone } from "./phone";

export interface WhatsAppWebhookConfig {
  appSecret: string;
  webhookVerifyToken: string;
  apiVersion: string;
  /** E.164, already validated normalizable — never undefined once returned. */
  expectedPhoneNumber: string;
  /**
   * Pre-provisioned System User token — see env.ts's doc comment on
   * WHATSAPP_SYSTEM_USER_ACCESS_TOKEN. Optional: its absence doesn't block
   * GET verification or PARTNER_ADDED persistence, only the phone-number
   * discovery step that follows it (see route.ts).
   */
  systemUserAccessToken: string | undefined;
}

export class WhatsAppWebhookConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppWebhookConfigError";
  }
}

/**
 * Reads and validates the env vars needed to receive and verify Meta's
 * Coexistence webhook. Throws a descriptive error naming which variables
 * are missing/invalid — never includes their values.
 */
export function getWhatsAppWebhookConfig(): WhatsAppWebhookConfig {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const expectedPhoneNumberRaw = process.env.WHATSAPP_EXPECTED_PHONE_NUMBER;
  const systemUserAccessToken = process.env.WHATSAPP_SYSTEM_USER_ACCESS_TOKEN || undefined;

  const missing: string[] = [];
  if (!appSecret) missing.push("WHATSAPP_APP_SECRET");
  if (!webhookVerifyToken) missing.push("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
  if (!expectedPhoneNumberRaw) missing.push("WHATSAPP_EXPECTED_PHONE_NUMBER");

  if (missing.length > 0) {
    throw new WhatsAppWebhookConfigError(
      `[whatsapp/webhook-config] WhatsApp webhook is not configured. Missing: ${missing.join(", ")}.`,
    );
  }

  const expectedPhoneNumber = normalizeTurkishPhone(expectedPhoneNumberRaw);
  if (!expectedPhoneNumber) {
    throw new WhatsAppWebhookConfigError(
      "[whatsapp/webhook-config] WHATSAPP_EXPECTED_PHONE_NUMBER is set but is not a normalizable Turkish E.164 number (expected +905XXXXXXXXX).",
    );
  }

  return {
    appSecret: appSecret!,
    webhookVerifyToken: webhookVerifyToken!,
    apiVersion,
    expectedPhoneNumber,
    systemUserAccessToken,
  };
}
