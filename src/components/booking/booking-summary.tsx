"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Clock, Loader2 } from "lucide-react";
import { createAppointmentRequest } from "@/app/(public)/b/[slug]/book/actions";
import type { BookingActionState } from "@/app/(public)/b/[slug]/book/actions";
import type { BookingBusiness } from "@/lib/queries/appointments";

type Service = BookingBusiness["services"][number];

function formatPrice(service: Service) {
  if (service.priceType === "FREE_CONSULTATION") return "Free consultation";
  if (service.priceType === "CONSULTATION_REQUIRED")
    return "Price on consultation";
  if (!service.price) return null;
  const amount = `$${Number(service.price)}`;
  if (service.priceType === "STARTS_FROM") return `From ${amount}`;
  return amount;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BookingSummary({
  business,
  service,
  date,
  time,
  customerNote,
  onNoteChange,
}: {
  business: BookingBusiness;
  service: Service;
  date: Date;
  time: string;
  customerNote: string;
  onNoteChange: (note: string) => void;
}) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const [state, formAction, isPending] = useActionState<
    BookingActionState,
    FormData
  >(createAppointmentRequest, { success: false });

  const price = formatPrice(service);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Confirm your appointment</h2>
        <p className="text-sm text-muted-foreground">
          Review the details and submit your request
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{business.name}</p>
              <p className="text-sm text-muted-foreground">{service.name}</p>
            </div>
            {price && (
              <p className="text-sm font-medium">{price}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarCheck className="size-4" />
              {formatDate(date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {time}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {service.durationMinutes} min
            </span>
          </div>
        </CardContent>
      </Card>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="businessId" value={business.id} />
        <input type="hidden" name="serviceId" value={service.id} />
        <input type="hidden" name="date" value={dateStr} />
        <input type="hidden" name="time" value={time} />

        <div className="space-y-2">
          <Label htmlFor="customerNote">Note (optional)</Label>
          <Textarea
            id="customerNote"
            name="customerNote"
            placeholder="Any preferences or special requests..."
            maxLength={500}
            value={customerNote}
            onChange={(e) => onNoteChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {customerNote.length}/500 characters
          </p>
        </div>

        {state.message && !state.success && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        {state.success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">
              {state.message}
            </p>
            <p className="mt-1 text-xs text-green-700">
              You can track your appointment in{" "}
              <a
                href="/account/appointments"
                className="underline hover:no-underline"
              >
                My Appointments
              </a>
              .
            </p>
          </div>
        )}

        {!state.success && (
          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CalendarCheck className="size-4" />
                Request Appointment
              </>
            )}
          </Button>
        )}
      </form>
    </div>
  );
}
