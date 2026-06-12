"use client";

import type { CSSProperties } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { minutesToTime, timeToMinutes } from "@/lib/calendar";
import { STATUS_LABELS } from "@/lib/constants/booking";
import {
  CALENDAR_STATUS_BADGE_VARIANT,
  CALENDAR_STATUS_CARD_CLASSES,
  BLOCKED_TIME_PSEUDO_STATUS,
} from "@/lib/constants/calendar";
import {
  getAppointmentCustomerName,
  getInitials,
  type SerializedCalendarAppointment,
  type CalendarBlockedTime,
} from "./types";

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes);
  return `${startTime}-${endTime}`;
}

interface AppointmentCardProps {
  item: SerializedCalendarAppointment | CalendarBlockedTime;
  kind: "appointment" | "blocked";
  variant: "timeline" | "list";
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function AppointmentCard({
  item,
  kind,
  variant,
  selected,
  onClick,
  style,
  className,
}: AppointmentCardProps) {
  if (kind === "blocked") {
    return (
      <BlockedTimeCard
        item={item as CalendarBlockedTime}
        variant={variant}
        selected={selected}
        onClick={onClick}
        style={style}
        className={className}
      />
    );
  }

  return (
    <AppointmentItemCard
      item={item as SerializedCalendarAppointment}
      variant={variant}
      selected={selected}
      onClick={onClick}
      style={style}
      className={className}
    />
  );
}

function AppointmentItemCard({
  item,
  variant,
  selected,
  onClick,
  style,
  className,
}: {
  item: SerializedCalendarAppointment;
  variant: "timeline" | "list";
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  const timeRange = formatTimeRange(item.requestedTime, item.service.durationMinutes);
  const customerName = getAppointmentCustomerName(item);
  const statusClasses = CALENDAR_STATUS_CARD_CLASSES[item.status];

  if (variant === "timeline") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={style}
        className={cn(
          "absolute overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring",
          statusClasses,
          selected && "ring-2 ring-ring",
          className,
        )}
      >
        <p className="truncate font-medium">{item.service.name}</p>
        <p className="truncate">{customerName}</p>
        <p className="truncate opacity-80">{timeRange}</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card p-3 text-left shadow-sm transition-colors hover:bg-surface-cream",
        selected && "ring-2 ring-ring",
        className,
      )}
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={item.customer.avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(item.customer.firstName, item.customer.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{customerName}</p>
          <Badge variant={CALENDAR_STATUS_BADGE_VARIANT[item.status]}>
            {STATUS_LABELS[item.status]}
          </Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{item.service.name}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{timeRange}</span>
          {item.professional && <span>{item.professional.displayName}</span>}
        </div>
      </div>
    </button>
  );
}

function BlockedTimeCard({
  item,
  variant,
  selected,
  onClick,
  style,
  className,
}: {
  item: CalendarBlockedTime;
  variant: "timeline" | "list";
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  const statusClasses = CALENDAR_STATUS_CARD_CLASSES[BLOCKED_TIME_PSEUDO_STATUS];
  const label = item.reason || "Bloklu zaman";

  if (variant === "timeline") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={style}
        className={cn(
          "absolute overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight",
          statusClasses,
          selected && "ring-2 ring-ring",
          className,
        )}
      >
        <p className="truncate font-medium">{label}</p>
        <p className="truncate opacity-80">
          {item.startTime}-{item.endTime}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left text-muted-foreground shadow-sm transition-colors hover:bg-surface-cream",
        selected && "ring-2 ring-ring",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{label}</p>
          <Badge variant={CALENDAR_STATUS_BADGE_VARIANT[BLOCKED_TIME_PSEUDO_STATUS]}>
            Bloklu
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span>
            {item.startTime}-{item.endTime}
          </span>
          {item.professional && <span>{item.professional.displayName}</span>}
        </div>
      </div>
    </button>
  );
}
