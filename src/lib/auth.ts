import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { UserRole } from "@/generated/prisma/enums";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await db.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    // Fallback sync: create DB user from Clerk data
    // Covers missed webhooks and local dev without tunnel
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();

  if (!user || user.role !== role) {
    redirect("/");
  }

  return user;
}

export async function requireBusiness() {
  const user = await requireRole(UserRole.BUSINESS_OWNER);

  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });

  if (!business) {
    redirect("/business/onboarding");
  }

  return { user, businessId: business.id };
}
