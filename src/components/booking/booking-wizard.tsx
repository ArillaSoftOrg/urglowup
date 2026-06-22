"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles, X } from "lucide-react";
import { BookingHeader } from "./booking-header";
import { BusinessChip } from "./business-chip";
import { ServicePicker } from "./service-picker";
import { ProfessionalPicker } from "./professional-picker";
import { DateTimePicker } from "./date-time-picker";
import { BookingSummary } from "./booking-summary";
import { LoginPrompt } from "./login-prompt";
import type { BookingBusiness } from "@/lib/queries/appointments";

type Service = BookingBusiness["services"][number];

function formatPrice(service: Service): {
  amount: string | null;
  qualifier: string | null;
} {
  if (service.priceType === "FREE_CONSULTATION")
    return { amount: "Ücretsiz danışma", qualifier: null };
  if (service.priceType === "CONSULTATION_REQUIRED")
    return { amount: "Fiyat için danışın", qualifier: null };
  if (!service.price) return { amount: null, qualifier: null };

  const amount = `₺${Number(service.price)}`;
  if (service.priceType === "STARTS_FROM")
    return { amount, qualifier: "itibaren" };
  return { amount, qualifier: null };
}

function BookingServiceSummary({
  business,
  service,
  onContinue,
}: {
  business: BookingBusiness;
  service: Service | undefined;
  onContinue: () => void;
}) {
  const price = service ? formatPrice(service) : { amount: null, qualifier: null };

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-8 rounded-xl border border-border bg-card p-10 shadow-sm">
        <div className="flex items-center gap-4">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={80}
              height={80}
              sizes="80px"
              className="size-20 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-lg bg-brand-pink/20">
              <Sparkles className="size-7 text-brand-pink-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{business.name}</p>
            <p className="text-sm text-muted-foreground">Randevu özeti</p>
          </div>
        </div>

        <div className="my-8 border-t border-border" />

        {service ? (
          <div className="space-y-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold">{service.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {service.durationMinutes} dk
                </p>
              </div>
              {price.amount && (
                <div className="shrink-0 text-right font-semibold">
                  {price.qualifier && (
                    <p className="text-xs font-normal text-muted-foreground">{price.qualifier}</p>
                  )}
                  {price.amount}
                </div>
              )}
            </div>

            <div className="border-t border-border" />

            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Toplam</span>
              <span>{price.amount ?? "Seçildi"}</span>
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={onContinue}
              className="mt-80 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              Devam et
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-lg bg-surface-cream p-4 text-sm text-muted-foreground">
            Devam etmek için bir hizmet seçin.
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileServiceBar({
  service,
  onContinue,
}: {
  service: Service | undefined;
  onContinue: () => void;
}) {
  const price = service ? formatPrice(service) : { amount: null, qualifier: null };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-bold">{price.amount ?? "Hizmet seçin"}</p>
          {service && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {service.name} · {service.durationMinutes} dk
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={onContinue}
          disabled={!service}
          className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
        >
          Devam et
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

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
  const getInitialStep = () => 1;

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
  }

  function continueFromService() {
    if (!selectedServiceId) return;
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
      {step === 1 ? (
        <div className="flex items-center justify-between">
          <Link
            href={`/b/${business.slug}`}
            className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-surface-cream"
            aria-label={`${business.name} profiline dön`}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Link
            href={`/b/${business.slug}`}
            className="hidden size-12 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-surface-cream lg:flex"
            aria-label="Randevu akışını kapat"
          >
            <X className="size-5" />
          </Link>
        </div>
      ) : (
        <>
          <BookingHeader
            businessName={business.name}
            businessSlug={business.slug}
            currentStep={step}
            totalSteps={stepLabels.length}
          />
          <BusinessChip business={business} />
        </>
      )}

      {/* Step indicator */}
      <div className={step === 1 ? "hidden lg:flex items-center gap-3 text-sm" : "flex items-center gap-2"}>
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className={step === 1 ? "flex items-center gap-3" : "flex items-center gap-2"}>
              {i > 0 && (
                <div
                  className={step === 1 ? "text-muted-foreground" : `h-px w-4 sm:w-8 ${
                    isDone || isActive ? "bg-brand-pink-foreground/40" : "bg-border"
                  }`}
                >
                  {step === 1 ? "›" : null}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={step === 1 ? "hidden" : `flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-pink text-brand-pink-foreground ring-2 ring-brand-pink-foreground/20"
                      : isDone
                        ? "bg-surface-pink text-brand-pink-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="size-3.5" /> : stepNum}
                </div>
                <span
                  className={`${step === 1 ? "inline text-base" : "hidden text-sm sm:inline"} ${
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

      {step === 1 && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,555px)] lg:items-start">
          <main>
            <h1 className="mb-10 text-4xl font-bold tracking-[-0.02em] sm:text-5xl">
              Hizmetleri seçin
            </h1>
            <ServicePicker
              services={business.services}
              selectedId={selectedServiceId}
              onSelect={handleServiceSelect}
            />
          </main>
          <BookingServiceSummary
            business={business}
            service={selectedService}
            onContinue={continueFromService}
          />
          <MobileServiceBar service={selectedService} onContinue={continueFromService} />
        </div>
      )}

      {/* Back button */}
      {step > 1 && (
        <Button type="button" variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Geri
        </Button>
      )}

      {/* Step 1: Service */}
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
