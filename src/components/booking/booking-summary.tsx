"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CalendarCheck,
  Clock,
  Hourglass,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Tag,
} from "lucide-react";
import { createAppointmentRequest } from "@/app/(public)/b/[slug]/book/actions";
import { validateCoupon } from "@/app/(business)/business/coupons/actions";
import type { BookingActionState } from "@/app/(public)/b/[slug]/book/actions";
import type { BookingBusiness } from "@/lib/queries/appointments";
import { BotProtectionFields } from "@/components/shared/bot-protection-fields";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

type Service = BookingBusiness["services"][number];
type Professional = BookingBusiness["professionals"][number];

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function BookingSummary({
  business,
  service,
  professional,
  date,
  time,
  customerNote,
  onNoteChange,
}: {
  business: BookingBusiness;
  service: Service;
  professional?: Professional;
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

  const [couponCode, setCouponCode] = useState("");
  const [couponState, setCouponState] = useState<
    | null
    | { valid: false; error: string }
    | { valid: true; discountAmount: number; couponId: string }
  >(null);
  const [couponPending, startCouponTransition] = useTransition();

  const servicePrice = service.price ? Number(service.price) : 0;

  function handleCouponApply() {
    if (!couponCode.trim()) return;
    startCouponTransition(async () => {
      const result = await validateCoupon(business.id, couponCode.trim(), servicePrice);
      setCouponState(result);
    });
  }

  const { amount, qualifier } = formatPrice(service);
  const fieldError = (key: string) => state.errors?.[key];

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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          Randevu özetinizi onaylayın
        </h2>
        <p className="text-sm text-muted-foreground">
          Detayları kontrol edin ve talebinizi gönderin
        </p>
      </div>

      <Card className="bg-surface-cream">
        <CardContent className="space-y-4 p-4">
          {/* Header strip: logo + name + service + price */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  width={48}
                  height={48}
                  sizes="48px"
                  className="size-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-pink/20">
                  <Sparkles className="size-5 text-brand-pink-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{business.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {service.name}
                </p>
              </div>
            </div>
            {amount && (
              <div className="shrink-0 text-right">
                {qualifier && (
                  <p className="text-xs text-muted-foreground">{qualifier}</p>
                )}
                <p className="text-base font-bold">{amount}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border/50" />

          {/* Detail rows */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3">
              <CalendarCheck className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-14 text-xs text-muted-foreground">Tarih</span>
              <span className="font-medium">{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-14 text-xs text-muted-foreground">Saat</span>
              <span className="font-medium">{time}</span>
            </div>
            <div className="flex items-center gap-3">
              <Hourglass className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-14 text-xs text-muted-foreground">Süre</span>
              <span className="font-medium">{service.durationMinutes} dk</span>
            </div>
            {professional && (
              <div className="flex items-center gap-3">
                <div className="size-4 shrink-0 text-muted-foreground text-center text-xs">👤</div>
                <span className="w-14 text-xs text-muted-foreground">Uzman</span>
                <span className="font-medium">{professional.displayName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trust callout */}
      <div className="flex items-start gap-2.5 rounded-lg bg-surface-pink/60 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-pink-foreground" />
        <p className="text-xs text-foreground/80">
          Talebiniz işletmeye iletilir. Onaylandığında size bildirilir.
        </p>
      </div>

      {/* Coupon field */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Kupon kodu (opsiyonel)"
            value={couponCode}
            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponState(null); }}
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
            ₺{couponState.discountAmount} indirim uygulandı!
          </p>
        )}
      </div>

      <form action={formAction} className="space-y-4">
        <BotProtectionFields />
        <input type="hidden" name="businessId" value={business.id} />
        <input type="hidden" name="serviceId" value={service.id} />
        {professional && <input type="hidden" name="professionalId" value={professional.id} />}
        {couponState?.valid && (
          <>
            <input type="hidden" name="couponId" value={couponState.couponId} />
            <input type="hidden" name="discountAmount" value={couponState.discountAmount} />
          </>
        )}
        <input type="hidden" name="date" value={dateStr} />
        <input type="hidden" name="time" value={time} />

        <div className="space-y-2">
          <Label htmlFor="customerNote">Not (isteğe bağlı)</Label>
          <Textarea
            id="customerNote"
            name="customerNote"
            placeholder="Tercihleriniz veya özel istekleriniz..."
            maxLength={500}
            value={customerNote}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={isPending}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {customerNote.length}/500 karakter
            </p>
            {fieldError("customerNote") && (
              <p className="text-xs text-destructive">
                {fieldError("customerNote")}
              </p>
            )}
          </div>
        </div>

        {(fieldError("serviceId") || fieldError("date") || fieldError("time") || fieldError("businessId")) && (
          <p className="text-xs text-destructive">
            {fieldError("serviceId") ?? fieldError("date") ?? fieldError("time") ?? fieldError("businessId")}
          </p>
        )}

        {state.message && !state.success && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{state.message}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          size="lg"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Gönderiliyor…
            </>
          ) : (
            <>
              <CalendarCheck className="size-4" />
              Randevu Talep Et
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
