"use client";

import { useActionState } from "react";
import {
  saveBusinessHours,
  type HoursActionState,
} from "@/app/(business)/business/hours/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Check } from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────

export type HourData = {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  slotIntervalMinutes: number;
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const SLOT_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

// ─── Component ──────────────────────────────────────────────────

export function HoursManager({
  initialHours,
}: {
  initialHours: HourData[];
}) {
  const initial: HoursActionState = { success: false };
  const [state, formAction, isPending] = useActionState(
    saveBusinessHours,
    initial
  );

  // Local state for toggling open/closed (controls UI visibility)
  const [openDays, setOpenDays] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const h of initialHours) {
      map[h.dayOfWeek] = h.isOpen;
    }
    return map;
  });

  function toggleDay(day: string) {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Working Hours</h1>
        <p className="text-sm text-muted-foreground">
          Set your weekly business hours
        </p>
      </div>

      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <Check className="size-4" />
          {state.message}
        </div>
      )}

      {state.message && !state.success && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="size-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              Toggle days open or closed and set operating hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialHours.map((hour) => {
              const day = hour.dayOfWeek;
              const isOpen = openDays[day] ?? false;

              return (
                <div
                  key={day}
                  className={`rounded-lg border p-4 transition-colors ${
                    isOpen ? "bg-background" : "bg-muted/50"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Day name + toggle */}
                    <div className="flex items-center gap-3 sm:w-36">
                      <input
                        type="checkbox"
                        name={`${day}_isOpen`}
                        checked={isOpen}
                        onChange={() => toggleDay(day)}
                        className="size-4 rounded border-input"
                      />
                      <span className="text-sm font-medium">
                        {DAY_LABELS[day]}
                      </span>
                      {!isOpen && (
                        <Badge variant="secondary" className="text-[10px]">
                          Closed
                        </Badge>
                      )}
                    </div>

                    {/* Time inputs */}
                    {isOpen && (
                      <div className="flex flex-1 flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`${day}_open`}
                            className="text-xs text-muted-foreground"
                          >
                            Open
                          </Label>
                          <Input
                            id={`${day}_open`}
                            name={`${day}_openTime`}
                            type="time"
                            defaultValue={hour.openTime ?? "09:00"}
                            className="w-28"
                          />
                        </div>
                        <span className="text-muted-foreground">-</span>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`${day}_close`}
                            className="text-xs text-muted-foreground"
                          >
                            Close
                          </Label>
                          <Input
                            id={`${day}_close`}
                            name={`${day}_closeTime`}
                            type="time"
                            defaultValue={hour.closeTime ?? "18:00"}
                            className="w-28"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`${day}_slot`}
                            className="text-xs text-muted-foreground whitespace-nowrap"
                          >
                            Slot
                          </Label>
                          <select
                            id={`${day}_slot`}
                            name={`${day}_slotIntervalMinutes`}
                            defaultValue={hour.slotIntervalMinutes}
                            className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            {SLOT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Hidden slot interval when closed */}
                    {!isOpen && (
                      <input
                        type="hidden"
                        name={`${day}_slotIntervalMinutes`}
                        value={hour.slotIntervalMinutes}
                      />
                    )}
                  </div>

                  {state.errors?.[day] && (
                    <p className="mt-2 text-xs text-destructive">
                      {state.errors[day]}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="pt-4">
              <Button type="submit" disabled={isPending} className="gap-1.5">
                {isPending ? "Saving..." : "Save Working Hours"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
