import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NotificationStatus } from "@/generated/prisma/enums";

// Resend webhook signature verification (optional but recommended)
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
 * Handle Resend email delivery events (bounces and complaints).
 * Updates the campaign recipient status to prevent future sends to bad addresses.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    if (RESEND_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-resend-signature");
      if (!signature) {
        console.warn("[webhook:resend] Missing signature header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // TODO: Implement Resend signature verification using crypto
      // For now, accept if secret is configured but signature missing (lenient)
    }

    const event: ResendWebhookEvent = await request.json();

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
