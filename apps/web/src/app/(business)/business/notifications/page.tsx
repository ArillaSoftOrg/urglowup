import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { markAllBusinessNotificationsRead } from "./actions";
import { cn } from "@/lib/utils";
import { BusinessNotificationList } from "@/components/business/layout/business-notification-list";

export default async function BusinessNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const { user, businessId } = await requireBusiness();
  const params = (await searchParams) ?? {};
  const showUnreadOnly = params.filter === "unread";

  const [notifications, unreadCount] = await Promise.all([
    db.inAppNotification.findMany({
      where: {
        businessId,
        recipientUserId: user.id,
        ...(showUnreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
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
        businessId,
        recipientUserId: user.id,
        readAt: null,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[oklch(0.48_0.05_285)]">
            İşletme paneli
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[oklch(0.2_0.035_285)]">
            Bildirimler
          </h1>
        </div>

        <form action={markAllBusinessNotificationsRead}>
          <button
            type="submit"
            disabled={unreadCount === 0}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[oklch(0.86_0.025_285)] bg-[oklch(0.995_0.006_285)] px-3 text-sm font-medium text-[oklch(0.26_0.035_285)] shadow-sm transition-colors hover:bg-[oklch(0.96_0.018_285)] disabled:pointer-events-none disabled:opacity-45"
          >
            <CheckCheck className="size-4" />
            Tümünü okundu işaretle
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/business/notifications"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            !showUnreadOnly
              ? "bg-[oklch(0.22_0.055_285)] text-white"
              : "bg-[oklch(0.94_0.015_285)] text-[oklch(0.32_0.04_285)] hover:bg-[oklch(0.9_0.02_285)]"
          )}
        >
          Tümü
        </Link>
        <Link
          href="/business/notifications?filter=unread"
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            showUnreadOnly
              ? "bg-[oklch(0.22_0.055_285)] text-white"
              : "bg-[oklch(0.94_0.015_285)] text-[oklch(0.32_0.04_285)] hover:bg-[oklch(0.9_0.02_285)]"
          )}
        >
          Okunmamış ({unreadCount})
        </Link>
      </div>

      <section className="overflow-hidden rounded-lg border border-[oklch(0.88_0.02_285)] bg-[oklch(0.995_0.006_285)] shadow-sm">
        {notifications.length > 0 ? (
          <BusinessNotificationList
            notifications={notifications.map((notification) => ({
              ...notification,
              createdAt: notification.createdAt.toISOString(),
              readAt: notification.readAt?.toISOString() ?? null,
            }))}
          />
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-[oklch(0.24_0.035_285)]">
              {showUnreadOnly ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[oklch(0.48_0.035_285)]">
              Yeni randevu talepleri, müşteri iptalleri ve ileride eklenecek işletme hareketleri burada listelenecek.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
