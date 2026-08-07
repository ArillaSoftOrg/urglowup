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
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          slug: true,
        },
      },
    },
  });

  if (!conversation || conversation.customerId !== userId) {
    return null;
  }

  await db.message.updateMany({
    where: {
      conversationId,
      isRead: false,
      senderId: { not: userId },
    },
    data: { isRead: true },
  });

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

// ── Business-side queries ────────────────────────────────────────────────────

export type BusinessConversation = {
  id: string;
  businessId: string;
  customerId: string;
  lastMessageAt: Date;
  createdAt: Date;
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  messages: {
    content: string;
    createdAt: Date;
    senderId: string;
  }[];
  _count: { messages: number };
};

export async function getConversationsForBusiness(
  businessId: string
): Promise<BusinessConversation[]> {
  return db.conversation.findMany({
    where: { businessId },
    select: {
      id: true,
      businessId: true,
      customerId: true,
      lastMessageAt: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
      _count: {
        select: {
          messages: { where: { isRead: false } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  }) as Promise<BusinessConversation[]>;
}

export async function getBusinessConversationMessages(
  conversationId: string,
  businessId: string
) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.businessId !== businessId) {
    return null;
  }

  // Mark messages from customer as read
  await db.message.updateMany({
    where: {
      conversationId,
      isRead: false,
      senderId: conversation.customerId,
    },
    data: { isRead: true },
  });

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

// ── Shared send ──────────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Both customer and business members (validated upstream) may send
  const isParticipant =
    conversation.customerId === senderId ||
    conversation.businessId !== null;

  if (!isParticipant) {
    throw new Error("Unauthorized");
  }

  const message = await db.message.create({
    data: { conversationId, senderId, content },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

export type MessageType = Awaited<ReturnType<typeof sendMessage>>;
