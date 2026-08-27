/**
 * Meta WhatsApp Business Platform webhook — GET verification + POST event
 * receiver, for the Coexistence Meta-hosted onboarding flow.
 *
 * This is the ACTUAL onboarding-completion signal for the Meta-hosted
 * "Generate link" flow (see Phase 1.1/1.2 reports): Meta notifies
 * completion via account_update / PARTNER_ADDED here, not via a redirect
 * with a code to api/integrations/whatsapp/callback (that route is now a
 * plain, credential-free landing page — see its own file).
 *
 * This phase only acts on PARTNER_ADDED. Every other webhook field
 * (messages, smb_message_echoes, smb_app_state_sync, other account_update
 * events) is safely ignored — see account-update-parser.ts's doc comment —
 * so a mixed/batched payload never fails the whole request. Full message
 * processing is a future phase.
 *
 * Security:
 *   - POST verifies X-Hub-Signature-256 (HMAC-SHA256 over the RAW body,
 *     WHATSAPP_APP_SECRET) BEFORE any JSON.parse — see webhook-signature.ts.
 *   - GET verifies hub.verify_token against WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *     with a constant-time comparison — see webhook-challenge.ts.
 *   - Neither the App Secret, the payload, nor any access token is ever
 *     logged — only safe, structured summaries (field names, event names,
 *     counts, masked phone numbers).
 *   - Meta may redeliver the same PARTNER_ADDED event; handling is
 *     idempotent — see integration-store.ts's recordWabaDiscovered().
 */
import { NextResponse } from "next/server";
import { verifyWebhookChallenge } from "@/lib/external/whatsapp/webhook-challenge";
import { verifyWhatsAppWebhookSignature } from "@/lib/external/whatsapp/webhook-signature";
import { parseWhatsAppWebhookEnvelope, type PartnerAddedEvent } from "@/lib/external/whatsapp/account-update-parser";
import { getWhatsAppWebhookConfig, WhatsAppWebhookConfigError } from "@/lib/external/whatsapp/webhook-config";
import { findExpectedWhatsAppPhoneNumber } from "@/lib/external/whatsapp/discovery";
import { recordWabaDiscovered, recordPhoneDiscovered, markFailed } from "@/lib/external/whatsapp/integration-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("[whatsapp/webhook] GET verification requested but WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const result = verifyWebhookChallenge(url.searchParams, verifyToken);

  if (!result.ok) {
    console.warn(`[whatsapp/webhook] GET verification rejected: ${result.reason}`);
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Meta expects the raw challenge string back, not JSON.
  return new NextResponse(result.challenge, { status: 200 });
}

export async function POST(request: Request) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("[whatsapp/webhook] POST received but WHATSAPP_APP_SECRET is not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppWebhookSignature(rawBody, signatureHeader, appSecret)) {
    console.warn("[whatsapp/webhook] signature verification failed — rejecting request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.warn("[whatsapp/webhook] request body was not valid JSON");
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const envelope = parseWhatsAppWebhookEnvelope(payload);
  if (!envelope) {
    console.warn("[whatsapp/webhook] payload envelope did not match the expected whatsapp_business_account shape");
    return NextResponse.json({ error: "Unexpected payload shape" }, { status: 400 });
  }

  if (envelope.ignoredFields.length > 0) {
    console.log(`[whatsapp/webhook] ignored unsupported field(s): ${envelope.ignoredFields.join(", ")}`);
  }
  if (envelope.ignoredAccountUpdateEvents.length > 0) {
    console.log(
      `[whatsapp/webhook] ignored account_update event(s): ${envelope.ignoredAccountUpdateEvents.join(", ")}`,
    );
  }

  for (const event of envelope.partnerAdded) {
    await handlePartnerAdded(event);
  }

  // Always 200 once the payload is authenticated and structurally valid —
  // Meta retries aggressively on non-200 responses, and none of the
  // downstream outcomes below (ambiguous phone match, incomplete config,
  // etc.) are things a retry would fix.
  return NextResponse.json({ success: true });
}

async function handlePartnerAdded(event: PartnerAddedEvent): Promise<void> {
  try {
    await recordWabaDiscovered(event);
  } catch (err) {
    console.error(
      "[whatsapp/webhook] failed to persist WABA_DISCOVERED:",
      err instanceof Error ? err.message : "unknown error",
    );
    return; // don't attempt phone discovery against a WABA ID we failed to persist
  }

  let webhookConfig;
  try {
    webhookConfig = getWhatsAppWebhookConfig();
  } catch (err) {
    if (err instanceof WhatsAppWebhookConfigError) {
      console.warn("[whatsapp/webhook] phone discovery skipped — configuration incomplete:", err.message);
    }
    // The WABA ID is safely persisted regardless; a future PARTNER_ADDED
    // redelivery (or a later phase's manual retrigger) will retry this
    // step once WHATSAPP_EXPECTED_PHONE_NUMBER etc. are configured.
    return;
  }

  if (!webhookConfig.systemUserAccessToken) {
    console.warn("[whatsapp/webhook] phone discovery skipped — WHATSAPP_SYSTEM_USER_ACCESS_TOKEN not configured");
    return;
  }

  try {
    const match = await findExpectedWhatsAppPhoneNumber(
      webhookConfig.apiVersion,
      event.wabaId,
      webhookConfig.systemUserAccessToken,
      webhookConfig.expectedPhoneNumber,
    );

    if (match.status === "matched") {
      await recordPhoneDiscovered({
        phoneNumberId: match.phoneNumberId,
        displayPhoneNumber: match.displayPhoneNumber,
      });
    } else if (match.status === "not_found") {
      await markFailed("no registered phone number matched WHATSAPP_EXPECTED_PHONE_NUMBER");
    } else {
      await markFailed(
        `ambiguous: ${match.matchCount} registered phone numbers matched WHATSAPP_EXPECTED_PHONE_NUMBER`,
      );
    }
  } catch (err) {
    console.error(
      "[whatsapp/webhook] phone discovery failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    await markFailed("phone discovery request failed").catch(() => {
      // Already logging the primary failure above; a secondary failure to
      // even record FAILED isn't worth a second error path here.
    });
  }
}
