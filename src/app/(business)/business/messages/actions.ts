"use server";

import { requireBusiness } from "@/lib/auth";
import { sendMessage } from "@/lib/queries/messages";
import { z } from "zod/v4";

const sendSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export async function sendBusinessMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; message?: string }> {
  const { user } = await requireBusiness();

  const parsed = sendSchema.safeParse({ conversationId, content });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  try {
    await sendMessage(conversationId, user.id, content.trim());
    return { success: true };
  } catch {
    return { success: false, message: "Mesaj gönderilemedi." };
  }
}
