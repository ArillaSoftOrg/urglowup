"use client";

import { useTransition } from "react";
import {
  applyHoliday,
  dismissHoliday,
  removeHolidayOverride,
  applyAllHolidays,
  dismissAllHolidays,
} from "@/app/(business)/business/hours/holiday-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarCheck, CalendarX, X } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

export type HolidayWithState = {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  state: "SUGGESTED" | "APPLIED" | "DISMISSED" | null;
};

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

// ─── Component ──────────────────────────────────────────────────

export function HolidaySuggestions({
  holidays,
  year,
}: {
  holidays: HolidayWithState[];
  year: number;
}) {
  const [isPending, startTransition] = useTransition();

  const pending = holidays.filter(
    (h) => h.state === null || h.state === "SUGGESTED"
  );
  const applied = holidays.filter((h) => h.state === "APPLIED");

  function handleApply(id: string) {
    startTransition(async () => {
      await applyHoliday(id);
    });
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      await dismissHoliday(id);
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeHolidayOverride(id);
    });
  }

  function handleApplyAll() {
    startTransition(async () => {
      await applyAllHolidays(year);
    });
  }

  function handleDismissAll() {
    startTransition(async () => {
      await dismissAllHolidays(year);
    });
  }

  if (holidays.length === 0) return null;

  return (
    <Card className={isPending ? "opacity-60 pointer-events-none" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck className="size-5" />
          Public Holiday Suggestions
        </CardTitle>
        <CardDescription>
          Only applied holidays block booking slots. Suggested holidays have no
          effect.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pending suggestions */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Suggestions for {year}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAll}
                  disabled={isPending}
                >
                  Apply all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissAll}
                  disabled={isPending}
                >
                  Dismiss all
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {pending.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-cream px-4 py-3"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {formatDate(h.date)}
                    </span>
                    <span className="mx-2 text-muted-foreground">—</span>
                    <span className="text-sm text-muted-foreground">
                      {h.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApply(h.id)}
                      disabled={isPending}
                    >
                      Apply closure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(h.id)}
                      disabled={isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applied closures */}
        {applied.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Applied closures
            </p>
            <div className="space-y-2">
              {applied.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CalendarX className="size-4 text-destructive" />
                    <div>
                      <span className="text-sm font-medium">
                        {formatDate(h.date)}
                      </span>
                      <span className="mx-2 text-muted-foreground">—</span>
                      <span className="text-sm text-muted-foreground">
                        {h.name}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">
                      Closed
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(h.id)}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && applied.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No holidays to display for {year}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
