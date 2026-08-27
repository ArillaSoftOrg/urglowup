/**
 * Meta webhook GET verification (hub.mode / hub.verify_token / hub.challenge).
 *
 * Meta calls this once when you register or re-verify a webhook URL in the
 * App Dashboard — see https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import { timingSafeEqual } from "crypto";

export type WebhookChallengeResult =
  | { ok: true; challenge: string }
  | { ok: false; reason: "mode_mismatch" | "token_mismatch" | "missing_params" };

/**
 * Verifies a webhook verification GET request's query parameters against
 * the configured verify token, using a constant-time comparison.
 *
 * @param params Parsed query string (hub.mode, hub.verify_token, hub.challenge).
 * @param expectedVerifyToken WHATSAPP_WEBHOOK_VERIFY_TOKEN — never logged.
 */
export function verifyWebhookChallenge(
  params: URLSearchParams,
  expectedVerifyToken: string,
): WebhookChallengeResult {
  const mode = params.get("hub.mode");
  const providedToken = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (!mode || !providedToken || !challenge) {
    return { ok: false, reason: "missing_params" };
  }

  if (mode !== "subscribe") {
    return { ok: false, reason: "mode_mismatch" };
  }

  const expectedBuf = Buffer.from(expectedVerifyToken, "utf8");
  const providedBuf = Buffer.from(providedToken, "utf8");

  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
    return { ok: false, reason: "token_mismatch" };
  }

  return { ok: true, challenge };
}
