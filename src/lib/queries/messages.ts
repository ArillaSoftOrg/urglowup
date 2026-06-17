import { db } from "@/lib/db";

export async function getConversationsForCustomer(userId: string) {
  return db.conversation.findMany({
    where: { customerId: userId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          slug: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderId: { not: userId } },
          },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export type CustomerConversation = Awaited<
  ReturnType<typeof getConversationsForCustomer>
>[number];

export async function getConversationMessages(
  conversationId: string,
  userId: string
) {
  // Verify user is part of this conversation
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.customerId !== userId) {
    return null;
  }

  // Mark messages from business as read
  await db.message.updateMany({
    where: {
      conversationId,
      isRead: false,
      senderId: { not: userId },
    },
    data: { isRead: true },
  });

  // Fetch all messages
  const messages = await db.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return { conversation, messages };
}

export type ConversationWithMessages = Awaited<
  ReturnType<typeof getConversationMessages>
>;

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  // Verify conversation exists and sender has access
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Only business owner (as a user) or customer can send messages
  // For now, only customer sends (business sends via admin actions)
  if (conversation.customerId !== senderId) {
    throw new Error("Unauthorized");
  }

  const message = await db.message.create({
    data: {
      conversationId,
      senderId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Update conversation's lastMessageAt
  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

export type MessageType = Awaited<ReturnType<typeof sendMessage>>;
