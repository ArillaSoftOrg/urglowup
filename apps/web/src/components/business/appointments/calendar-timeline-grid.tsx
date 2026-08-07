"use client";

import { cn } from "@/lib/utils";

export interface TimelineShadedRange {
  startMinutes: number;
  endMinutes: number;
}

export interface TimelineColumn {
  id: string;
  header?: React.ReactNode;
  content: React.ReactNode;
  /** Ranges (minutes from midnight) to shade as outside working hours. */
  shaded?: TimelineShadedRange[];
  onSlotClick?: (minutes: number) => void;
}

interface CalendarTimelineGridProps {
  startHour: number;
  endHour: number;
  hourHeightPx: number;
  columns: TimelineColumn[];
  className?: string;
}

/**
 * Shared hour-based timeline grid: a left hour-label gutter plus N content
 * columns with horizontal hour lines. Used by Day, Week, and Staff views —
 * callers position cards absolutely within each column via getCardPosition.
 */
export function CalendarTimelineGrid({
  startHour,
  endHour,
  hourHeightPx,
  columns,
  className,
}: CalendarTimelineGridProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const totalHeight = (endHour - startHour) * hourHeightPx;
  const showHeaders = columns.some((col) => col.header);

  return (
    <div className={cn("flex", className)}>
      <div className="w-12 shrink-0 sm:w-14">
        {showHeaders && <div className="h-10 border-b border-border/50" />}
        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
              style={{ top: (hour - startHour) * hourHeightPx }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>
      </div>

      <div
        className="grid flex-1"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(7rem, 1fr))` }}
      >
        {columns.map((col) => (
          <div key={col.id} className="border-l border-border/50">
            {showHeaders && (
              <div className="flex h-10 items-center border-b border-border/50 px-2 text-xs font-medium">
                <span className="truncate">{col.header}</span>
              </div>
            )}
            <div
              className="relative"
              style={{ height: totalHeight }}
              onClick={(e) => {
                if (!col.onSlotClick) return;
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const rawMinutes = startHour * 60 + (offsetY / hourHeightPx) * 60;
                const snapped = Math.round(rawMinutes / 15) * 15;
                col.onSlotClick(snapped);
              }}
            >
              {hours.slice(0, -1).map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-border/30"
                  style={{ top: (hour - startHour) * hourHeightPx }}
                />
              ))}
              {col.shaded?.map((range, i) => {
                const top = ((range.startMinutes - startHour * 60) / 60) * hourHeightPx;
                const height = ((range.endMinutes - range.startMinutes) / 60) * hourHeightPx;
                return (
                  <div
                    key={i}
                    className="pointer-events-none absolute inset-x-0 bg-muted/40"
                    style={{ top, height }}
                  />
                );
              })}
              {col.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
