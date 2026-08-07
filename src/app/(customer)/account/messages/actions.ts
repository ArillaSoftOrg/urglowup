"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMessage } from "@/lib/queries/messages";
import { enforceRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

interface GetOrCreateConversationResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

/** Finds or creates the single conversation between the current customer and a business. */
export async function getOrCreateConversation(
  businessId: string,
): Promise<GetOrCreateConversationResult> {
  const user = await getCurrentUser();

  if (!user || user.role !== "CUSTOMER") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const conversation = await db.conversation.upsert({
      where: { businessId_customerId: { businessId, customerId: user.id } },
      update: {},
      create: { businessId, customerId: user.id },
      select: { id: true },
    });
    return { success: true, conversationId: conversation.id };
  } catch (err) {
    console.error("[messages] Failed to get or create conversation:", err);
    return { success: false, error: "Konuşma başlatılamadı" };
  }
}

interface SendMessageResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendCustomerMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResult> {
  const user = await getCurrentUser();

  if (!user || user.role !== "CUSTOMER") {
    return { success: false, error: "Unauthorized" };
  }

  if (!content?.trim()) {
    return { success: false, error: "Message cannot be empty" };
  }

  if (content.length > 5000) {
    return { success: false, error: "Message is too long" };
  }

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

  try {
    await sendMessage(conversationId, user.id, content);
    revalidatePath(`/account/messages/${conversationId}`);
    return { success: true, message: "Mesaj gönderildi" };
  } catch (err) {
    console.error("[messages] Failed to send message:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Mesaj gönderilemedi",
    };
  }
}
