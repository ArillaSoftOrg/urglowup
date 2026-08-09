import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { NotificationStatus } from "@/generated/prisma/enums";

// Resend delivers webhooks via Svix. Secret is stored as "whsec_<base64>" in the dashboard.
const RESEND_WEBHOOK_SECRET = env.RESEND_WEBHOOK_SECRET;

// Reject replays older than 5 minutes (Svix recommendation).
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    id: string; // Resend message ID
    email: string;
    created_at: string;
  };
}

/**
 * Verify a Svix-signed webhook payload (used by Resend).
 *
 * Algorithm (https://docs.svix.com/receiving/verifying-payloads/how-manual):
 *   signed_content = "{svix-id}.{svix-timestamp}.{raw_body}"
 *   key            = base64_decode(secret_after_whsec_prefix)
 *   mac            = HMAC-SHA256(signed_content, key) → base64
 *
 * The svix-signature header is space-delimited; each entry is "v1,{base64_mac}".
 * Pass if ANY entry matches (Svix rotates keys by sending multiple signatures during rollover).
 */
function verifySvixSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  try {
    // 1. Validate timestamp to prevent replay attacks.
    const timestampMs = parseInt(svixTimestamp, 10) * 1000;
    if (
      isNaN(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > TIMESTAMP_TOLERANCE_MS
    ) {
      return false;
    }

    // 2. Derive the HMAC key: strip optional "whsec_" prefix, then base64-decode.
    const base64Secret = secret.startsWith("whsec_")
      ? secret.slice("whsec_".length)
      : secret;
    const keyBytes = Buffer.from(base64Secret, "base64");

    // 3. Construct the signed content string.
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

    // 4. Compute HMAC-SHA256, encode as base64.
    const expectedMac = createHmac("sha256", keyBytes)
      .update(signedContent, "utf8")
      .digest("base64");
    const expectedBuf = Buffer.from(expectedMac);

    // 5. The header is space-delimited; each token is "v1,{base64_mac}".
    //    Succeed if ANY token matches (supports key rotation rollover).
    const tokens = svixSignature.split(" ");
    for (const token of tokens) {
      const commaIdx = token.indexOf(",");
      if (commaIdx === -1) continue;
      const mac = token.slice(commaIdx + 1);
      const macBuf = Buffer.from(mac);
      if (
        macBuf.length === expectedBuf.length &&
        timingSafeEqual(macBuf, expectedBuf)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Handle Resend email delivery events (bounces and complaints).
 * Updates campaign recipient status to prevent future sends to bad addresses.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // In production, a missing secret is a misconfiguration — reject all requests.
    if (!RESEND_WEBHOOK_SECRET) {
      if (process.env.NODE_ENV === "production") {
        console.error(
          "[webhook:resend] RESEND_WEBHOOK_SECRET is not set — rejecting all requests in production"
        );
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // In development, warn and allow through for local testing.
      console.warn(
        "[webhook:resend] RESEND_WEBHOOK_SECRET not set — skipping signature verification (dev only)"
      );
    } else {
      // Verify Svix signature headers.
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");
      const svixSignature = request.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.warn("[webhook:resend] Missing required Svix headers");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (
        !verifySvixSignature(
          rawBody,
          svixId,
          svixTimestamp,
          svixSignature,
          RESEND_WEBHOOK_SECRET
        )
      ) {
        console.warn("[webhook:resend] Svix signature verification failed");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const event: ResendWebhookEvent = JSON.parse(rawBody);

    if (!event.type || !event.data?.id) {
      return NextResponse.json(
        { error: "Invalid event structure" },
        { status: 400 }
      );
    }

    const messageId = event.data.id;
    const email = event.data.email;

    if (event.type === "email.bounced") {
      const result = await db.campaignRecipient.updateMany({
        where: { providerMessageId: messageId },
        data: {
          status: NotificationStatus.SKIPPED,
          errorMessage: "Email bounced (Resend notification)",
        },
      });

      if (result.count > 0) {
        console.log(
          `[webhook:resend] Marked ${result.count} recipient(s) as bounced for message ${messageId}`
        );
      } else {
        console.warn(
          `[webhook:resend] No campaign recipient found for bounced message ${messageId} (${email})`
        );
      }

      return NextResponse.json({ success: true, updated: result.count });
    }

    if (event.type === "email.complained") {
      const result = await db.campaignRecipient.updateMany({
        where: { providerMessageId: messageId },
        data: {
          status: NotificationStatus.SKIPPED,
          errorMessage: "Email marked as complaint/spam (Resend notification)",
        },
      });

      if (result.count > 0) {
        console.log(
          `[webhook:resend] Marked ${result.count} recipient(s) as complained for message ${messageId}`
        );
      } else {
        console.warn(
          `[webhook:resend] No campaign recipient found for complaint message ${messageId} (${email})`
        );
      }

      return NextResponse.json({ success: true, updated: result.count });
    }

    // Silently ignore all other event types.
    return NextResponse.json({ success: true, ignored: true });
  } catch (error) {
    console.error("[webhook:resend] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
