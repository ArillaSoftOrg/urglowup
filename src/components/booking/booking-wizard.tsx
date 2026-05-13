"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServicePicker } from "./service-picker";
import { DateTimePicker } from "./date-time-picker";
import { BookingSummary } from "./booking-summary";
import { LoginPrompt } from "./login-prompt";
import type { BookingBusiness } from "@/lib/queries/appointments";

const STEP_LABELS = ["Service", "Date & Time", "Confirm"];

export function BookingWizard({
  business,
  isLoggedIn,
  initialServiceId,
}: {
  business: BookingBusiness;
  isLoggedIn: boolean;
  initialServiceId?: string;
}) {
  const [step, setStep] = useState(initialServiceId ? 2 : 1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialServiceId ?? null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");

  const selectedService = business.services.find(
    (s) => s.id === selectedServiceId
  );

  function handleServiceSelect(id: string) {
    setSelectedServiceId(id);
    // Reset date/time when service changes
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(2);
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep(3);
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  // Build redirect URL preserving state
  const redirectUrl = `/b/${business.slug}/book${selectedServiceId ? `?service=${selectedServiceId}` : ""}`;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div className="h-px w-4 bg-border sm:w-8" />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stepNum}
                </div>
                <span
                  className={`hidden text-sm sm:inline ${
                    isActive ? "font-medium" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back button */}
      {step > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goBack}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      )}

      {/* Steps */}
      {step === 1 && (
        <ServicePicker
          services={business.services}
          selectedId={selectedServiceId}
          onSelect={handleServiceSelect}
        />
      )}

      {step === 2 && selectedServiceId && (
        <DateTimePicker
          business={business}
          serviceId={selectedServiceId}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectDate={handleDateSelect}
          onSelectTime={handleTimeSelect}
        />
      )}

      {step === 3 && selectedService && selectedDate && selectedTime && (
        isLoggedIn ? (
          <BookingSummary
            business={business}
            service={selectedService}
            date={selectedDate}
            time={selectedTime}
            customerNote={customerNote}
            onNoteChange={setCustomerNote}
          />
        ) : (
          <LoginPrompt redirectUrl={redirectUrl} />
        )
      )}
    </div>
  );
}
