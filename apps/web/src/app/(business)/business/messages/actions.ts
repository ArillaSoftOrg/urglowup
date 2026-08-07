"use server";

import { requireBusiness } from "@/lib/auth";
import { sendMessage } from "@/lib/queries/messages";
import { enforceRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { z } from "zod/v4";

const sendSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export async function sendBusinessMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const { user } = await requireBusiness();

  const rateLimit = await enforceRateLimit({
    scope: "message",
    headers: await headers(),
    subjectId: user.id,
    ipLimit: 120,
    subjectLimit: 60,
  });
  if (!rateLimit.ok) {
    return { success: false, error: rateLimit.message };
  }

  const parsed = sendSchema.safeParse({ conversationId, content });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await sendMessage(conversationId, user.id, content.trim());
    return { success: true, message: "Mesaj gönderildi" };
  } catch (err) {
    console.error("[messages] Failed to send business message:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Mesaj gönderilemedi.",
    };
  }
}
