/**
 * Server-side configuration for Meta WhatsApp Embedded Signup (Coexistence)
 * onboarding — the WABA/phone-number connection flow, not message sending.
 *
 * This is unrelated to ./client.ts (sendWhatsAppTemplate etc.), which keeps
 * using WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN unchanged.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */

export interface WhatsAppOnboardingConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  apiVersion: string;
}

export class WhatsAppOnboardingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppOnboardingConfigError";
  }
}

/**
 * Reads and validates the Meta app credentials needed for the Embedded
 * Signup authorization-code exchange.
 *
 * @throws WhatsAppOnboardingConfigError naming which variables are missing.
 *         Never includes variable values — only names — so this is always
 *         safe to log or return in an error response.
 */
export function getWhatsAppOnboardingConfig(): WhatsAppOnboardingConfig {
  const appId = process.env.WHATSAPP_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const redirectUri = process.env.WHATSAPP_REDIRECT_URI;
  // Reuses the same version pin as the message-sending client (client.ts) —
  // both talk to the same Graph API, so they should track together.
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";

  const missing: string[] = [];
  if (!appId) missing.push("WHATSAPP_APP_ID");
  if (!appSecret) missing.push("WHATSAPP_APP_SECRET");
  if (!redirectUri) missing.push("WHATSAPP_REDIRECT_URI");

  if (missing.length > 0) {
    throw new WhatsAppOnboardingConfigError(
      `[whatsapp/onboarding-config] WhatsApp Embedded Signup is not configured. Missing: ${missing.join(", ")}.`,
    );
  }

  return { appId: appId!, appSecret: appSecret!, redirectUri: redirectUri!, apiVersion };
}
