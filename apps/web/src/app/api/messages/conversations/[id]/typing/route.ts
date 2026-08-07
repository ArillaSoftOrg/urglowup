import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// In-memory typing state: { conversationId: { userId, expiresAt } }
const typingState = new Map<string, Map<string, number>>();

// Cleanup old entries every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [convId, users] of typingState.entries()) {
    for (const [userId, expiresAt] of users.entries()) {
      if (expiresAt < now) {
        users.delete(userId);
      }
    }
    if (users.size === 0) {
      typingState.delete(convId);
    }
  }
}, 30000);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { isTyping } = await request.json();

    // Verify user has access to conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user is either customer or business member
    if (
      conversation.customerId !== session.user.id &&
      !(await db.businessMember.findFirst({
        where: {
          userId: session.user.id,
          businessId: conversation.businessId,
        },
      }))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update typing state
    if (!typingState.has(conversationId)) {
      typingState.set(conversationId, new Map());
    }

    const convTyping = typingState.get(conversationId)!;
    const now = Date.now();

    if (isTyping) {
      // User is typing: expire after 5 seconds of inactivity
      convTyping.set(session.user.id, now + 5000);
    } else {
      // User stopped typing
      convTyping.delete(session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api:typing]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get who's typing (excluding self)
    const typingUsers = Array.from(
      typingState.get(conversationId)?.keys() ?? []
    ).filter((userId) => userId !== session.user.id);

    return NextResponse.json({
      isTyping: typingUsers.length > 0,
      typingUserIds: typingUsers,
    });
  } catch (error) {
    console.error("[api:typing-get]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
