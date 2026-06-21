"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BookingHeader } from "./booking-header";
import { BusinessChip } from "./business-chip";
import { ServicePicker } from "./service-picker";
import { ProfessionalPicker } from "./professional-picker";
import { DateTimePicker } from "./date-time-picker";
import { BookingSummary } from "./booking-summary";
import { LoginPrompt } from "./login-prompt";
import type { BookingBusiness } from "@/lib/queries/appointments";

export function BookingWizard({
  business,
  isLoggedIn,
  initialServiceId,
  initialProfessionalId,
}: {
  business: BookingBusiness;
  isLoggedIn: boolean;
  initialServiceId?: string;
  initialProfessionalId?: string;
}) {
  const hasProfessionals = business.professionals.length > 0;

  // Steps: 1=Hizmet, 2=Uzman (optional), 3=Tarih&Saat, 4=Onayla
  const getInitialStep = () => {
    if (!initialServiceId) return 1;
    if (hasProfessionals && !initialProfessionalId) return 2;
    return 3;
  };

  const [step, setStep] = useState(getInitialStep);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialServiceId ?? null);
  // null = any professional (assigned by business), undefined = not yet chosen
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(
    initialProfessionalId ?? null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerNote, setCustomerNote] = useState("");

  const selectedService = business.services.find((s) => s.id === selectedServiceId);
  const selectedProfessional = selectedProfessionalId
    ? business.professionals.find((p) => p.id === selectedProfessionalId)
    : null;

  // Build dynamic step labels
  const stepLabels = hasProfessionals
    ? ["Hizmet", "Uzman", "Tarih & Saat", "Onayla"]
    : ["Hizmet", "Tarih & Saat", "Onayla"];

  const dateStep = hasProfessionals ? 3 : 2;
  const confirmStep = hasProfessionals ? 4 : 3;

  function handleServiceSelect(id: string) {
    setSelectedServiceId(id);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(hasProfessionals ? 2 : dateStep);
  }

  function handleProfessionalSelect(id: string | null) {
    setSelectedProfessionalId(id);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(dateStep);
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep(confirmStep);
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  const redirectUrl = `/b/${business.slug}/book${selectedServiceId ? `?service=${selectedServiceId}` : ""}`;

  return (
    <div className="space-y-6">
      <BookingHeader
        businessName={business.name}
        businessSlug={business.slug}
        currentStep={step}
        totalSteps={stepLabels.length}
      />

      <BusinessChip business={business} />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-4 sm:w-8 ${
                    isDone || isActive ? "bg-brand-pink-foreground/40" : "bg-border"
                  }`}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-pink text-brand-pink-foreground ring-2 ring-brand-pink-foreground/20"
                      : isDone
                        ? "bg-surface-pink text-brand-pink-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stepNum}
                </div>
                <span
                  className={`hidden text-sm sm:inline ${
                    isActive
                      ? "font-semibold text-foreground"
                      : isDone
                        ? "text-foreground/70"
                        : "text-muted-foreground"
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
        <Button type="button" variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Geri
        </Button>
      )}

      {/* Step 1: Service */}
      {step === 1 && (
        <ServicePicker
          services={business.services}
          selectedId={selectedServiceId}
          onSelect={handleServiceSelect}
        />
      )}

      {/* Step 2: Professional (only when business has professionals) */}
      {step === 2 && hasProfessionals && selectedServiceId && (
        <ProfessionalPicker
          professionals={business.professionals}
          serviceId={selectedServiceId}
          selectedId={selectedProfessionalId}
          onSelect={handleProfessionalSelect}
        />
      )}

      {/* Step 3: Date & Time */}
      {step === dateStep && selectedServiceId && (
        <DateTimePicker
          business={business}
          serviceId={selectedServiceId}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          isLoggedIn={isLoggedIn}
          onSelectDate={handleDateSelect}
          onSelectTime={handleTimeSelect}
        />
      )}

      {/* Step 4: Confirm */}
      {step === confirmStep &&
        selectedService &&
        selectedDate &&
        selectedTime &&
        (isLoggedIn ? (
          <BookingSummary
            business={business}
            service={selectedService}
            professional={selectedProfessional ?? undefined}
            date={selectedDate}
            time={selectedTime}
            customerNote={customerNote}
            onNoteChange={setCustomerNote}
          />
        ) : (
          <LoginPrompt redirectUrl={redirectUrl} />
        ))}
    </div>
  );
}
