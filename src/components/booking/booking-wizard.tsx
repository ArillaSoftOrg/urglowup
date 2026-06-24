"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MoreVertical,
  Plus,
  Shuffle,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "./date-time-picker";
import { BookingSummary, type BookingSummaryItem } from "./booking-summary";
import { LoginPrompt } from "./login-prompt";
import type { BookingBusiness } from "@/lib/queries/appointments";

type Service = BookingBusiness["services"][number];
type Professional = BookingBusiness["professionals"][number];
type BookingKind = "single" | "group";
type Step = "kind" | "services" | "guests" | "experts" | "datetime" | "firstVisit" | "summary";

interface GuestDraft {
  id: string;
  name: string;
  index: number;
  serviceIds: string[];
}

function formatCurrency(value: number) {
  return `${value} ₺`;
}

function servicePrice(service: Service) {
  return service.price ? Number(service.price) : 0;
}

function serviceSubtitle(service: Service) {
  return service.description || `${service.durationMinutes} dk`;
}

function guestServiceKey(guestId: string, serviceId: string) {
  return `${guestId}:${serviceId}`;
}

function ServiceCard({
  service,
  selected,
  onToggle,
}: {
  service: Service;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-32 w-full items-start rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-foreground/20 hover:shadow-sm",
        selected
          ? "border-brand-purple-foreground ring-2 ring-brand-purple-foreground/80"
          : "border-border"
      )}
    >
      <div className="min-w-0 pr-14">
        <p className="font-semibold">{service.name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {serviceSubtitle(service)}
        </p>
        <p className="mt-6 text-base font-bold">{formatCurrency(servicePrice(service))}</p>
      </div>
      <span
        className={cn(
          "absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border shadow-sm",
          selected
            ? "border-brand-purple-foreground bg-brand-purple-foreground text-background"
            : "border-border bg-background text-foreground"
        )}
      >
        {selected ? <Check className="size-5" /> : <Plus className="size-5" />}
      </span>
    </button>
  );
}

function BottomBar({
  totalPrice,
  itemCount,
  duration,
  disabled,
  onContinue,
  label = "Devam et",
}: {
  totalPrice: number;
  itemCount: number;
  duration: number;
  disabled?: boolean;
  onContinue: () => void;
  label?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-bold">{formatCurrency(totalPrice)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {itemCount} öğe · {duration} dk
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          disabled={disabled}
          className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
        >
          {label}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function GuestHeader({
  guest,
  active,
  onClick,
}: {
  guest: GuestDraft;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-xs",
        active ? "border-brand-purple-foreground ring-2 ring-brand-purple-foreground/70" : "border-border"
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
        <UserRound className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{guest.name}</p>
        <p className="text-sm text-muted-foreground">
          {guest.serviceIds.length} hizmet
        </p>
      </div>
      <MoreVertical className="size-5 text-muted-foreground" />
    </button>
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
  const router = useRouter();
  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<BookingKind>("single");
  const [activeGuestId, setActiveGuestId] = useState("me");
  const [guests, setGuests] = useState<GuestDraft[]>([
    {
      id: "me",
      name: "Ben",
      index: 0,
      serviceIds: initialServiceId ? [initialServiceId] : [],
    },
  ]);
  const [professionalByItem, setProfessionalByItem] = useState<Record<string, string | null>>(
    initialServiceId && initialProfessionalId
      ? { [guestServiceKey("me", initialServiceId)]: initialProfessionalId }
      : {}
  );
  const [expertMode, setExpertMode] = useState<"any" | "custom">("any");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [firstVisit, setFirstVisit] = useState<boolean | null>(null);
  const [exitPending, setExitPending] = useState(false);
  const [bookingCompleted, setBookingCompleted] = useState(false);

  const servicesById = useMemo(
    () => new Map(business.services.map((service) => [service.id, service])),
    [business.services]
  );
  const professionalsById = useMemo(
    () => new Map(business.professionals.map((professional) => [professional.id, professional])),
    [business.professionals]
  );
  const selectedItems = useMemo<BookingSummaryItem[]>(() => {
    return guests.flatMap((guest) =>
      guest.serviceIds.flatMap((serviceId) => {
        const service = servicesById.get(serviceId);
        if (!service) return [];
        const professionalId = professionalByItem[guestServiceKey(guest.id, serviceId)];
        return [
          {
            guestName: guest.name,
            guestIndex: guest.index,
            service,
            professional: professionalId ? professionalsById.get(professionalId) ?? null : null,
          },
        ];
      })
    );
  }, [guests, professionalByItem, professionalsById, servicesById]);

  const totalPrice = selectedItems.reduce((sum, item) => sum + servicePrice(item.service), 0);
  const totalDuration = selectedItems.reduce((sum, item) => sum + item.service.durationMinutes, 0);
  const activeGuest = guests.find((guest) => guest.id === activeGuestId) ?? guests[0];
  const primaryService = selectedItems[0]?.service;
  const hasProfessionals = business.professionals.length > 0;
  const redirectUrl = `/b/${business.slug}/book${primaryService ? `?service=${primaryService.id}` : ""}`;

  const singleEligibleProfessional = useMemo(() => {
    if (kind !== "single") return undefined;
    const meGuest = guests.find((g) => g.id === "me");
    const serviceIds = meGuest?.serviceIds ?? [];
    if (serviceIds.length === 0) return undefined;
    const eligible = business.professionals.filter((p) =>
      serviceIds.every((sid) => p.services.some((s) => s.serviceId === sid))
    );
    return eligible.length === 1 ? eligible[0] : undefined;
  }, [kind, guests, business.professionals]);

  const hasProgress = step !== "kind" && !bookingCompleted;

  function handleExit() {
    if (hasProgress) {
      setExitPending(true);
    } else {
      router.push(`/b/${business.slug}`);
    }
  }

  function confirmExit() {
    router.push(`/b/${business.slug}`);
  }

  useEffect(() => {
    if (!hasProgress) return;

    history.pushState(null, "", location.href);

    function handlePopState() {
      history.pushState(null, "", location.href);
      setExitPending(true);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasProgress]);

  function goBack() {
    if (step === "kind") return;
    if (step === "services") setStep("kind");
    if (step === "guests") setStep("services");
    if (step === "experts") setStep(kind === "group" ? "guests" : "services");
    if (step === "datetime") {
      if (singleEligibleProfessional) {
        setStep(kind === "group" ? "guests" : "services");
      } else {
        setStep(hasProfessionals ? "experts" : kind === "group" ? "guests" : "services");
      }
    }
    if (step === "firstVisit") setStep("datetime");
    if (step === "summary") setStep("firstVisit");
  }

  function toggleService(serviceId: string) {
    setGuests((current) =>
      current.map((guest) => {
        if (guest.id !== activeGuest.id) return guest;
        const hasService = guest.serviceIds.includes(serviceId);
        return {
          ...guest,
          serviceIds: hasService
            ? guest.serviceIds.filter((id) => id !== serviceId)
            : [...guest.serviceIds, serviceId],
        };
      })
    );
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function addGuest() {
    if (guests.length >= business.maxGroupBookingGuests) return;
    const index = guests.length;
    const id = `guest-${index}`;
    setGuests((current) => [
      ...current,
      { id, name: `Misafir ${index + 1}`, index, serviceIds: [] },
    ]);
    setActiveGuestId(id);
    setStep("services");
  }

  function setAllExpertsToAny() {
    setExpertMode("any");
    setProfessionalByItem({});
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function setItemProfessional(guestId: string, serviceId: string, professionalId: string | null) {
    setProfessionalByItem((current) => ({
      ...current,
      [guestServiceKey(guestId, serviceId)]: professionalId,
    }));
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function availableProfessionals(serviceId: string) {
    return business.professionals.filter((professional) =>
      professional.services.some((service) => service.serviceId === serviceId)
    );
  }

  function continueFromServices() {
    if (activeGuest.serviceIds.length === 0) return;
    if (kind === "group") {
      setStep("guests");
      return;
    }
    if (singleEligibleProfessional) {
      const next: Record<string, string | null> = {};
      activeGuest.serviceIds.forEach((sid) => {
        next[guestServiceKey(activeGuest.id, sid)] = singleEligibleProfessional.id;
      });
      setProfessionalByItem(next);
      setExpertMode("custom");
      setStep("datetime");
      return;
    }
    setStep(hasProfessionals ? "experts" : "datetime");
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-8rem)] max-w-3xl bg-background px-4 pb-8 pt-4">
      <div className="mb-8 flex items-center justify-between">
        {step === "kind" ? (
          <Link
            href={`/b/${business.slug}`}
            className="flex size-11 items-center justify-center rounded-full text-foreground hover:bg-surface-cream"
            aria-label={`${business.name} profiline dön`}
          >
            <ArrowLeft className="size-6" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={goBack}
            className="flex size-11 items-center justify-center rounded-full text-foreground hover:bg-surface-cream"
            aria-label="Geri"
          >
            <ArrowLeft className="size-6" />
          </button>
        )}
        <button
          type="button"
          onClick={handleExit}
          className="flex size-11 items-center justify-center rounded-full text-foreground hover:bg-surface-cream"
          aria-label="Randevu akışını kapat"
        >
          <X className="size-6" />
        </button>
      </div>

      {step === "kind" && (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold tracking-tight">Bir seçenek belirleyin</h1>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setKind("single");
                setActiveGuestId("me");
                setStep("services");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-xs hover:bg-surface-cream"
            >
              <span>
                <span className="block font-semibold">Randevu alın</span>
                <span className="text-sm text-muted-foreground">Kendiniz için hizmet planlaması yapın</span>
              </span>
              <UserRound className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => {
                setKind("group");
                setStep("services");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left shadow-xs hover:bg-surface-cream"
            >
              <span>
                <span className="block font-semibold">Grup randevusu alın</span>
                <span className="text-sm text-muted-foreground">Kendiniz ve başkaları için</span>
              </span>
              <UsersRound className="size-6" />
            </button>
          </div>
        </div>
      )}

      {step === "services" && (
        <div className="space-y-6 pb-28">
          <h1 className="text-3xl font-bold tracking-tight">Hizmetleri seçin</h1>
          <GuestHeader
            guest={activeGuest}
            active
            onClick={() => {
              if (kind === "group") setStep("guests");
            }}
          />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Berberlik</h2>
            {business.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={activeGuest.serviceIds.includes(service.id)}
                onToggle={() => toggleService(service.id)}
              />
            ))}
          </div>
          <BottomBar
            totalPrice={totalPrice}
            itemCount={selectedItems.length}
            duration={totalDuration}
            disabled={activeGuest.serviceIds.length === 0}
            onContinue={continueFromServices}
          />
        </div>
      )}

      {step === "guests" && (
        <div className="space-y-6 pb-28">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Misafir ve hizmet ekleyin</h1>
            <p className="text-muted-foreground">
              En fazla {business.maxGroupBookingGuests} misafir için grup randevusu alın
            </p>
          </div>
          <div className="space-y-3">
            {guests.map((guest) => (
              <GuestHeader
                key={guest.id}
                guest={guest}
                active={guest.id === activeGuestId}
                onClick={() => {
                  setActiveGuestId(guest.id);
                  setStep("services");
                }}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGuest}
            disabled={guests.length >= business.maxGroupBookingGuests}
            className="rounded-full"
          >
            <Plus className="size-4" />
            Misafir ekle
          </Button>
          <BottomBar
            totalPrice={totalPrice}
            itemCount={selectedItems.length}
            duration={totalDuration}
            disabled={selectedItems.length === 0}
            onContinue={() => setStep(hasProfessionals ? "experts" : "datetime")}
          />
        </div>
      )}

      {step === "experts" && (
        <div className="space-y-6 pb-28">
          <h1 className="text-3xl font-bold tracking-tight">Uzman seçin</h1>
          <div className="space-y-4">
            <button
              type="button"
              onClick={setAllExpertsToAny}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-xs",
                expertMode === "any"
                  ? "border-brand-purple-foreground ring-2 ring-brand-purple-foreground/70"
                  : "border-border"
              )}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
                <Shuffle className="size-7" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Tercih yok</span>
                <span className="text-sm text-muted-foreground">Maksimum müsaitlik</span>
              </span>
              {expertMode === "any" ? (
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-purple-foreground text-background">
                  <Check className="size-5" />
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setExpertMode("custom")}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-xs",
                expertMode === "custom"
                  ? "border-brand-purple-foreground ring-2 ring-brand-purple-foreground/70"
                  : "border-border"
              )}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-surface-purple text-brand-purple-foreground">
                <UsersRound className="size-7" />
              </span>
              <span className="min-w-0 flex-1 font-semibold">Hizmete özel uzman seçin</span>
              <span className="rounded-full border border-border px-4 py-2 text-sm font-medium">Seç</span>
            </button>
          </div>

          {expertMode === "custom" && (
            <div className="space-y-6">
              {guests
                .filter((guest) => guest.serviceIds.length > 0)
                .map((guest) => (
                  <div key={guest.id} className="space-y-3">
                    <h2 className="text-xl font-semibold">{guest.name}</h2>
                    {guest.serviceIds.map((serviceId) => {
                      const service = servicesById.get(serviceId);
                      if (!service) return null;
                      const key = guestServiceKey(guest.id, serviceId);
                      return (
                        <div key={key} className="rounded-xl border border-border bg-card p-4 shadow-xs">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.durationMinutes} dk</p>
                          <select
                            value={professionalByItem[key] ?? ""}
                            onChange={(event) =>
                              setItemProfessional(guest.id, serviceId, event.target.value || null)
                            }
                            className="mt-4 min-h-[44px] rounded-full border border-input bg-background px-4 text-sm"
                            aria-label={`${service.name} için uzman`}
                          >
                            <option value="">Tercih yok</option>
                            {availableProfessionals(serviceId).map((professional) => (
                              <option key={professional.id} value={professional.id}>
                                {professional.displayName}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          )}

          <BottomBar
            totalPrice={totalPrice}
            itemCount={selectedItems.length}
            duration={totalDuration}
            disabled={selectedItems.length === 0}
            onContinue={() => setStep("datetime")}
          />
        </div>
      )}

      {step === "datetime" && primaryService && (
        <div className="pb-28">
          <DateTimePicker
            business={business}
            serviceId={primaryService.id}
            durationMinutes={totalDuration}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            isLoggedIn={isLoggedIn}
            professionalName={selectedItems[0]?.professional?.displayName ?? undefined}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            onSelectTime={(time) => {
              setSelectedTime(time);
              setStep("firstVisit");
            }}
          />
          <BottomBar
            totalPrice={totalPrice}
            itemCount={selectedItems.length}
            duration={totalDuration}
            disabled={!selectedDate || !selectedTime}
            onContinue={() => {
              if (selectedDate && selectedTime) setStep("firstVisit");
            }}
          />
        </div>
      )}

      {step === "firstVisit" && (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Bu sizin ilk {business.name} ziyaretiniz mi?
          </h1>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setFirstVisit(true);
                setStep("summary");
              }}
              className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-xs hover:bg-surface-cream"
            >
              <span className="block font-semibold">Evet</span>
              <span className="text-sm text-muted-foreground">Bu benim ilk ziyaretim</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFirstVisit(false);
                setStep("summary");
              }}
              className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-xs hover:bg-surface-cream"
            >
              <span className="block font-semibold">Hayır</span>
              <span className="text-sm text-muted-foreground">Daha önce ziyaret ettim</span>
            </button>
          </div>
        </div>
      )}

      {step === "summary" &&
        selectedDate &&
        selectedTime &&
        firstVisit !== null &&
        (isLoggedIn ? (
          <BookingSummary
            business={business}
            items={selectedItems}
            date={selectedDate}
            time={selectedTime}
            firstVisit={firstVisit}
            onComplete={() => setBookingCompleted(true)}
          />
        ) : (
          <LoginPrompt redirectUrl={redirectUrl} />
        ))}

      {exitPending && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setExitPending(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background px-6 pb-10 pt-6 shadow-xl lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 id="exit-modal-title" className="text-lg font-bold leading-snug">
                Çıkmak istediğinizden emin misiniz?
              </h2>
              <button
                type="button"
                onClick={() => setExitPending(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-surface-cream"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Rezervasyonunuz tamamlanmadı ve ilerlemeniz kaybolacak.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                size="lg"
                className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
                onClick={confirmExit}
              >
                Evet, çık
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-full"
                onClick={() => setExitPending(false)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
