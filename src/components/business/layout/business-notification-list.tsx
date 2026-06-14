"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Clock } from "lucide-react";
import { markBusinessNotificationRead } from "@/app/(business)/business/notifications/actions";
import { cn } from "@/lib/utils";
import type { InAppNotificationType } from "@/generated/prisma/enums";

export type BusinessNotificationListItem = {
  id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function BusinessNotificationList({
  notifications,
}: {
  notifications: BusinessNotificationListItem[];
}) {
  const [, startTransition] = useTransition();

  function markRead(notification: BusinessNotificationListItem) {
    if (notification.readAt) return;
    startTransition(async () => {
      await markBusinessNotificationRead(notification.id);
    });
  }

  return (
    <div className="divide-y divide-[oklch(0.9_0.015_285)]">
      {notifications.map((notification) => (
        <Link
          key={notification.id}
          href={notification.href}
          onClick={() => markRead(notification)}
          className={cn(
            "grid grid-cols-[auto_1fr] gap-4 px-4 py-4 transition-colors hover:bg-[oklch(0.965_0.015_285)] sm:px-5",
            !notification.readAt && "bg-[oklch(0.975_0.022_285)]"
          )}
        >
          <span
            className={cn(
              "mt-2 size-2.5 rounded-full",
              notification.readAt
                ? "bg-[oklch(0.76_0.02_285)]"
                : "bg-[oklch(0.68_0.22_345)]"
            )}
          />
          <span className="min-w-0">
            <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <span>
                <span className="block text-sm font-semibold text-[oklch(0.22_0.035_285)]">
                  {notification.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-[oklch(0.42_0.035_285)]">
                  {notification.body}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[oklch(0.52_0.035_285)]">
                <Clock className="size-3.5" />
                {formatDate(notification.createdAt)}
              </span>
            </span>
            <span className="mt-3 inline-flex rounded-md bg-[oklch(0.94_0.015_285)] px-2 py-1 text-xs font-medium text-[oklch(0.36_0.04_285)]">
              {typeLabel(notification.type)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeLabel(type: InAppNotificationType) {
  switch (type) {
    case "APPOINTMENT_REQUESTED":
      return "Randevu talebi";
    case "APPOINTMENT_CANCELLED_BY_CUSTOMER":
      return "Müşteri iptali";
    case "REVIEW_RECEIVED":
      return "Yorum";
    case "PROFILE_ATTENTION":
      return "Profil";
    case "INTEGRATION_ALERT":
      return "Entegrasyon";
    case "TEAM_UPDATE":
      return "Ekip";
  }
}
