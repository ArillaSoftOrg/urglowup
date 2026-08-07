"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildAuthRedirectQuery } from "@/lib/auth-redirect";
import { hashInvitationToken } from "@/lib/invitation-token";

export async function acceptInvitation(token: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login${buildAuthRedirectQuery(`/business/invite/${token}`)}`);
  }

  const tokenHash = hashInvitationToken(token);
  const invitation = await db.businessInvitation.findUnique({
    where: { tokenHash },
  });

  if (
    !invitation ||
    invitation.acceptedAt !== null ||
    invitation.expiresAt < new Date() ||
    invitation.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    redirect(`/business/invite/${token}`);
  }

  await db.$transaction([
    db.businessMember.upsert({
      where: {
        businessId_userId: {
          businessId: invitation.businessId,
          userId: user.id,
        },
      },
      create: {
        businessId: invitation.businessId,
        userId: user.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      },
      update: {
        role: invitation.role,
      },
    }),
    db.businessInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  redirect("/business/dashboard");
}
