"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell, CheckCheck, Clock, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markAllBusinessNotificationsRead,
  markBusinessNotificationRead,
} from "@/app/(business)/business/notifications/actions";
import { cn } from "@/lib/utils";
import type { InAppNotificationType } from "@/generated/prisma/enums";

export type BusinessNotificationMenuItem = {
  id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function BusinessNotificationMenu({
  notifications,
  unreadCount,
}: {
  notifications: BusinessNotificationMenuItem[];
  unreadCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  function markAllRead() {
    if (unreadCount === 0) return;
    startTransition(async () => {
      await markAllBusinessNotificationsRead();
    });
  }

  function markRead(notification: BusinessNotificationMenuItem) {
    if (notification.readAt) return;
    startTransition(async () => {
      await markBusinessNotificationRead(notification.id);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Bildirimler"
        className="relative flex size-9 items-center justify-center rounded-full text-business-nav-muted transition-colors hover:bg-white/10 hover:text-business-nav-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-[oklch(0.68_0.22_345)] px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(calc(100vw-2rem),380px)] p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Bildirimler</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} okunmamis bildirim` : "Yeni bildirim yok"}
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0 || isPending}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
            aria-label="Tümünü okundu işaretle"
            title="Tümünü okundu işaretle"
          >
            <CheckCheck className="size-4" />
          </button>
        </div>

        {notifications.length > 0 ? (
          <div className="max-h-[360px] overflow-y-auto p-1">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-0 focus:bg-transparent"
                onClick={() => markRead(notification)}
              >
                <Link
                  href={notification.href}
                  className={cn(
                    "grid w-full grid-cols-[auto_1fr] gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
                    !notification.readAt && "bg-[oklch(0.97_0.025_285)]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 size-2 rounded-full",
                      notification.readAt
                        ? "bg-muted-foreground/25"
                        : "bg-[oklch(0.68_0.22_345)]"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {notification.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                      {notification.body}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Bildirim yok</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Yeni randevu ve iptal hareketleri burada gorunecek.
            </p>
          </div>
        )}

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem className="cursor-pointer p-0 focus:bg-transparent">
          <Link
            href="/business/notifications"
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            Tüm bildirimler
            <ExternalLink className="size-3.5" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Az once";
  if (diffMinutes < 60) return `${diffMinutes} dk once`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa once`;

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
