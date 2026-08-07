import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getActiveBusinessAccess } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { BusinessSidebar } from "@/components/business/layout/business-sidebar";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots,
};

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const access = await getActiveBusinessAccess(user);
  if (!access) {
    // Consistent with requireBusiness: owner → onboarding; otherwise home.
    if (user.role === UserRole.BUSINESS_OWNER) redirect("/business/onboarding");
    redirect("/");
  }

  const [notifications, unreadCount] = await Promise.all([
    db.inAppNotification.findMany({
      where: {
        businessId: access.businessId,
        recipientUserId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.inAppNotification.count({
      where: {
        businessId: access.businessId,
        recipientUserId: user.id,
        readAt: null,
      },
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.985_0.012_285)]">
      <BusinessSidebar
        memberRole={access.memberRole}
        notifications={notifications.map((notification) => ({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString() ?? null,
        }))}
        unreadCount={unreadCount}
      />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-7 md:px-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
