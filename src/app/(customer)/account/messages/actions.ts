"use server";

import { getCurrentUser } from "@/lib/auth";
import { sendMessage } from "@/lib/queries/messages";
import { revalidatePath } from "next/cache";

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

  try {
    await sendMessage(conversationId, user.id, content);
    revalidatePath(`/account/messages/${conversationId}`);
    return { success: true, message: "Message sent" };
  } catch (err) {
    console.error("[messages] Failed to send message:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send message",
    };
  }
}
