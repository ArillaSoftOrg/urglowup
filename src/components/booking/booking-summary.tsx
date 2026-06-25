"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { createAppointmentRequest } from "@/app/(public)/b/[slug]/book/actions";
import { validateCoupon } from "@/app/(business)/business/coupons/actions";
import type { BookingActionState } from "@/app/(public)/b/[slug]/book/actions";
import type { BookingBusiness } from "@/lib/queries/appointments";

type Service = BookingBusiness["services"][number];
type Professional = BookingBusiness["professionals"][number];

export interface BookingSummaryItem {
  guestName: string;
  guestIndex: number;
  service: Service;
  professional?: Professional | null;
}

function formatCurrency(value: number) {
  return `${value} ₺`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function getPrice(service: Service) {
  return service.price ? Number(service.price) : 0;
}

export function BookingSummary({
  business,
  items,
  date,
  time,
  firstVisit,
  onComplete,
}: {
  business: BookingBusiness;
  items: BookingSummaryItem[];
  date: Date;
  time: string;
  firstVisit: boolean;
  onComplete?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<
    BookingActionState,
    FormData
  >(createAppointmentRequest, { success: false });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  useEffect(() => {
    if (state.success) onCompleteRef.current?.();
  }, [state.success]);
  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<
    | null
    | { valid: false; error: string }
    | { valid: true; discountAmount: number; couponId: string }
  >(null);
  const [couponPending, startCouponTransition] = useTransition();
  const [couponOpen, setCouponOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const totalPrice = items.reduce((sum, item) => sum + getPrice(item.service), 0);
  const totalDuration = items.reduce((sum, item) => sum + item.service.durationMinutes, 0);
  const primary = items[0];
  const grouped = items.reduce<Map<number, BookingSummaryItem[]>>((map, item) => {
    const current = map.get(item.guestIndex) ?? [];
    current.push(item);
    map.set(item.guestIndex, current);
    return map;
  }, new Map());

  function handleCouponApply() {
    if (!couponCode.trim()) return;
    startCouponTransition(async () => {
      const result = await validateCoupon(business.id, couponCode.trim(), totalPrice);
      setCouponState(result);
    });
  }

  if (state.success) {
    return (
      <EmptyState
        icon={CalendarCheck}
        headline="Randevu talebiniz alındı!"
        description="İşletme talebinizi inceleyecek ve onaylandığında bilgilendirileceksiniz."
        surface="pink"
        action={{
          label: "Randevularım",
          href: "/account/appointments",
          variant: "brand",
        }}
        secondaryAction={{
          label: "İşletme profiline dön",
          href: `/b/${business.slug}`,
        }}
      />
    );
  }

  return (
    <div className="space-y-5 pb-28">
      <h2 className="text-3xl font-bold tracking-tight">İnceleyin ve onaylayın</h2>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={64}
              height={64}
              sizes="64px"
              className="size-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand-pink/20">
              <Sparkles className="size-6 text-brand-pink-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold">{business.name}</p>
            <p className="flex items-center gap-1 text-sm font-semibold">
              5,0 <Star className="size-4 fill-warning-foreground text-warning-foreground" /> <span className="text-muted-foreground">(146)</span>
            </p>
            <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {business.district || business.city || "İşletme adresi"}
            </p>
          </div>
        </div>

        <div className="my-5 border-t border-border/50" />

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <CalendarCheck className="size-4 text-muted-foreground" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="size-4 text-muted-foreground" />
            <span>
              {time} ({totalDuration} dk süre)
            </span>
          </div>
        </div>

        <div className="my-5 border-t border-border/50" />

        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([guestIndex, guestItems]) => (
            <div key={guestIndex} className="space-y-3">
              <p className="font-semibold">{guestItems[0].guestName}</p>
              {guestItems.map((item) => (
                <div key={`${guestIndex}-${item.service.id}`} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{item.service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.service.durationMinutes} dk. ile {item.professional?.displayName ?? "herhangi bir uzman"}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatCurrency(getPrice(item.service))}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="my-5 border-t border-border/50" />

        <div className="flex items-center justify-between font-semibold">
          <span>Toplam</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">İlk ziyaret</p>
        <p className="text-sm text-muted-foreground">
          {firstVisit ? "Evet, bu benim ilk ziyaretim." : "Hayır, daha önce ziyaret ettim."}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        {!noteOpen ? (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="flex w-full items-center justify-between text-sm"
          >
            <span className="font-medium">Bilmemizi istediğiniz bir şey var mı?</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="font-medium">Notunuz</span>
              <ChevronUp className="size-4 text-muted-foreground" />
            </button>
            <Textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Özel isteklerinizi veya notlarınızı buraya yazın..."
              maxLength={500}
              rows={3}
            />
            <p className="text-right text-xs text-muted-foreground">{customerNote.length}/500</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        {!couponOpen ? (
          <button
            type="button"
            onClick={() => setCouponOpen(true)}
            className="flex w-full items-center justify-between text-sm"
          >
            <span className="font-medium">
              Kupon kodunuz var mı?{" "}
              <span className="text-brand-purple-foreground">Ekle</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setCouponOpen(false)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="font-medium">Kupon kodu</span>
              <ChevronUp className="size-4 text-muted-foreground" />
            </button>
            <div className="flex gap-2">
              <Input
                aria-label="Kupon kodu"
                placeholder="Kupon kodu"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setCouponState(null);
                }}
                className="font-mono uppercase"
                maxLength={20}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCouponApply}
                disabled={couponPending || !couponCode.trim()}
                className="shrink-0"
              >
                <Tag className="size-4" />
                Uygula
              </Button>
            </div>
            {couponState && !couponState.valid && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" />
                {couponState.error}
              </p>
            )}
            {couponState?.valid && (
              <p className="flex items-center gap-1.5 text-xs text-success-foreground">
                <CheckCircle2 className="size-3.5" />
                {formatCurrency(couponState.discountAmount)} indirim uygulandı.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Info className="size-4 text-muted-foreground" />
          İptal politikası
        </p>
        <p className="text-sm text-muted-foreground">
          Randevu başlangıcından 2 saat öncesine kadar ücretsiz iptal edebilirsiniz.
        </p>
      </div>

      <form action={formAction} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <BotProtectionFields />
        <input type="hidden" name="businessId" value={business.id} />
        <input type="hidden" name="serviceId" value={primary.service.id} />
        <input type="hidden" name="professionalId" value={primary.professional?.id ?? ""} />
        <input
          type="hidden"
          name="itemsJson"
          value={JSON.stringify(
            items.map((item) => ({
              guestName: item.guestName,
              guestIndex: item.guestIndex,
              serviceId: item.service.id,
              professionalId: item.professional?.id ?? null,
            }))
          )}
        />
        <input type="hidden" name="firstVisit" value={String(firstVisit)} />
        {couponState?.valid && (
          <>
            <input type="hidden" name="couponId" value={couponState.couponId} />
            <input type="hidden" name="discountAmount" value={couponState.discountAmount} />
          </>
        )}
        <input type="hidden" name="date" value={dateStr} />
        <input type="hidden" name="time" value={time} />
        {customerNote.trim() && (
          <input type="hidden" name="customerNote" value={customerNote.trim()} />
        )}

        {state.message && !state.success && (
          <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{state.message}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold">{formatCurrency(totalPrice)}</p>
            <p className="text-xs text-muted-foreground">Mağazada ödeme yapmak için</p>
          </div>
          <Button
            type="submit"
            className="rounded-full bg-foreground px-7 text-background hover:bg-foreground/90"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Gönderiliyor
              </>
            ) : (
              "Onayla"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
