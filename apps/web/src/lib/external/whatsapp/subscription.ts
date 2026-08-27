/**
 * WABA → app webhook subscription for Coexistence.
 *
 * DO NOT call subscribeAppToWaba() as part of the onboarding callback yet.
 * The moment this subscription exists, Meta starts delivering webhook
 * events (messages, delivery statuses, Coexistence echo events) to
 * whatever webhook URL is configured for this app in the Meta App
 * dashboard — and that receiving endpoint
 * (apps/web/src/app/api/webhooks/whatsapp/route.ts) does not exist yet.
 * Subscribing before it exists means Meta's events are dropped/retried
 * against a 404 with no way to recover them after the fact.
 *
 * Call this function only after:
 *   1. api/webhooks/whatsapp/route.ts is implemented and deployed
 *   2. Its GET verification (hub.challenge) has been confirmed working
 *      against Meta's dashboard "Verify and save" check
 *
 * See the Phase 1 report's "WABA Subscription Durumu" section for the
 * exact call-site recommendation.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import type { WhatsAppOnboardingConfig } from "./onboarding-config";
import { markConnected } from "./integration-store";

export class WhatsAppSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppSubscriptionError";
  }
}

/**
 * Subscribes this app to a WABA's webhook events: POST /{WABA-ID}/subscribed_apps
 *
 * Idempotent on Meta's side — calling it again for an already-subscribed
 * WABA is a documented no-op success, not an error.
 */
export async function subscribeAppToWaba(
  config: WhatsAppOnboardingConfig,
  wabaId: string,
  accessToken: string,
): Promise<void> {
  const url = `https://graph.facebook.com/${config.apiVersion}/${wabaId}/subscribed_apps`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new WhatsAppSubscriptionError("WABA subscription network request failed");
  }

  if (!response.ok) {
    throw new WhatsAppSubscriptionError(`WABA subscription failed with status ${response.status}`);
  }
}

/**
 * Orchestration wrapper prepared for a future phase — NOT called from
 * api/webhooks/whatsapp/route.ts yet. See this file's top doc comment for
 * why: the receiving webhook route must be deployed and its GET
 * verification confirmed working against Meta's dashboard first, or
 * subscribing now would point Meta at an endpoint that doesn't (reliably)
 * exist.
 *
 * When it IS safe to call (a future phase, or a manually triggered
 * internal action): idempotent by construction — subscribeAppToWaba()
 * itself is a no-op success on Meta's side if already subscribed, and this
 * wrapper only calls markConnected() after that succeeds, so calling it
 * repeatedly (e.g. retried after a transient network failure) is safe and
 * converges on the same CONNECTED end state without side effects beyond
 * the subscription itself.
 */
export async function ensureSubscribedToWaba(
  config: WhatsAppOnboardingConfig,
  wabaId: string,
  accessToken: string,
): Promise<void> {
  await subscribeAppToWaba(config, wabaId, accessToken);
  await markConnected();
}
