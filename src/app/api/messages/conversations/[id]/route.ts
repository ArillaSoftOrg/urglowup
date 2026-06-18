import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getConversationMessages,
  getBusinessConversationMessages,
} from "@/lib/queries/messages";
import { CACHE_PRESETS } from "@/lib/cache-headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if caller is a business member — if so, serve the business view.
    const membership = await db.businessMember.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (membership) {
      const result = await getBusinessConversationMessages(
        id,
        membership.businessId
      );
      if (!result) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result);
    }

    // Fallback: customer view
    const result = await getConversationMessages(id, session.user.id);

    if (!result) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api:messages]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
