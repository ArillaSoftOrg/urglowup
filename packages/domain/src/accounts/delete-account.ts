import { db } from "@urglowup/db";

export type DeleteAccountResult = { ok: true } | { ok: false; reason: "NOT_FOUND" | "ALREADY_DELETED" };

/**
 * Account deletion, implemented as anonymization rather than a row delete —
 * see the User.deletedAt doc comment in schema.prisma for why. Required for
 * App Store / Play Store review (both mandate an in-app deletion path).
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!user) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (user.deletedAt) {
    return { ok: false, reason: "ALREADY_DELETED" };
  }

  const anonymizedEmail = `deleted-${userId}@deleted.urglowup.invalid`;

  await db.$transaction([
    // Future bookings can't be honored by a deleted account — cancel them.
    db.appointment.updateMany({
      where: {
        customerId: userId,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
      data: {
        status: "CANCELLED_BY_CUSTOMER",
        cancelledReason: "Account deleted",
      },
    }),
    // Revoke access: delete sessions and any linked OAuth accounts so a
    // still-valid Google session can't sign back into this (now-anonymized)
    // user id.
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        emailVerified: false,
        name: "",
        firstName: null,
        lastName: null,
        phone: null,
        serviceAddress: null,
        avatarUrl: null,
        twoFactorEnabled: false,
        deletedAt: new Date(),
      },
    }),
  ]);

  return { ok: true };
}
