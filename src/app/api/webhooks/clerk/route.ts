import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin-bootstrap";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      // Permanent skip — no email address on this Clerk user
      return new Response("OK", { status: 200 });
    }

    const isAdmin = isAdminEmail(email);

    try {
      const dbUser = await db.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          avatarUrl: image_url,
          ...(isAdmin && { role: "ADMIN" }),
        },
        update: {
          email,
          firstName: first_name,
          lastName: last_name,
          avatarUrl: image_url,
          // Only promote — never overwrite a role downward
          ...(isAdmin && { role: "ADMIN" }),
        },
        select: { id: true },
      });

      if (eventType === "user.created") {
        await db.userPreferences.upsert({
          where: { userId: dbUser.id },
          create: { userId: dbUser.id },
          update: {},
        });
      }
    } catch (err) {
      console.error("[clerk-webhook] DB upsert failed:", err);
      return new Response("Internal error", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      try {
        await db.user.deleteMany({ where: { clerkId: id } });
      } catch (err) {
        // Log but return 200 — retrying a delete is not useful
        console.error("[clerk-webhook] DB delete failed for clerkId:", id, err);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
