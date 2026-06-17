import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { NotificationStatus } from "@/generated/prisma/enums";

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    id: string; // message_id
    email: string;
    created_at: string;
  };
}

/**
 * Verify Resend webhook signature using HMAC-SHA256.
 * Resend signs the body with: HMAC-SHA256(body, secret) → base64 in x-resend-signature header
 */
function verifyResendSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hash = createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== hash.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ hash.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

/**
 * Handle Resend email delivery events (bounces and complaints).
 * Updates the campaign recipient status to prevent future sends to bad addresses.
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    if (RESEND_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-resend-signature");
      if (!signature) {
        console.warn("[webhook:resend] Missing signature header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!verifyResendSignature(rawBody, signature, RESEND_WEBHOOK_SECRET)) {
        console.warn("[webhook:resend] Invalid signature");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const event: ResendWebhookEvent = JSON.parse(rawBody);

    if (!event.type || !event.data?.id) {
      return NextResponse.json(
        { error: "Invalid event structure" },
        { status: 400 },
      );
    }

    const messageId = event.data.id;
    const email = event.data.email;

    if (event.type === "email.bounced") {
      const reason = `Email bounced (Resend notification)`;
      const result = await db.campaignRecipient.updateMany({
        where: {
          providerMessageId: messageId,
        },
        data: {
          status: NotificationStatus.SKIPPED,
          errorMessage: reason,
        },
      });

      if (result.count > 0) {
        console.log(
          `[webhook:resend] Marked ${result.count} recipient(s) as bounced for message ${messageId}`,
        );
      } else {
        console.warn(
          `[webhook:resend] No campaign recipient found for bounced message ${messageId} (${email})`,
        );
      }

      return NextResponse.json({ success: true, updated: result.count });
    }

    if (event.type === "email.complained") {
      const reason = `Email marked as complaint/spam (Resend notification)`;
      const result = await db.campaignRecipient.updateMany({
        where: {
          providerMessageId: messageId,
        },
        data: {
          status: NotificationStatus.SKIPPED,
          errorMessage: reason,
        },
      });

      if (result.count > 0) {
        console.log(
          `[webhook:resend] Marked ${result.count} recipient(s) as complained for message ${messageId}`,
        );
      } else {
        console.warn(
          `[webhook:resend] No campaign recipient found for complaint message ${messageId} (${email})`,
        );
      }

      return NextResponse.json({ success: true, updated: result.count });
    }

    // Silently ignore other event types (we only care about bounces and complaints)
    return NextResponse.json({ success: true, ignored: true });
  } catch (error) {
    console.error("[webhook:resend] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
