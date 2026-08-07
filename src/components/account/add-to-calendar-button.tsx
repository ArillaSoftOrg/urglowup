"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAppointmentIcs } from "@/lib/calendar-export";

export function AddToCalendarButton({
  title,
  description,
  location,
  date,
  time,
  durationMinutes,
}: {
  title: string;
  description?: string;
  location?: string;
  date: string;
  time: string;
  durationMinutes: number;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        downloadAppointmentIcs({ title, description, location, date, time, durationMinutes })
      }
    >
      <CalendarPlus className="size-3.5" />
      Takvime ekle
    </Button>
  );
}
