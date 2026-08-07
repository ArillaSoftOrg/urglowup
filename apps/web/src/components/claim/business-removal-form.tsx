"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { submitBusinessRemovalRequest } from "@/app/(public)/remove-business/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CLAIM_VERIFICATION_LABELS,
  PUBLIC_CLAIM_VERIFICATION_TYPES,
  type PublicClaimVerificationType,
} from "@/lib/constants/claim";

const REMOVAL_REASONS = [
  ["BUSINESS_CLOSED", "İşletme kalıcı olarak kapandı"],
  ["DUPLICATE", "Bu sayfa başka bir kaydın tekrarı"],
  ["INCORRECT_INFORMATION", "İşletme bilgileri yanlış veya yanıltıcı"],
  ["NO_CONSENT", "İşletme bu sayfanın yayınlanmasını istemiyor"],
  ["OTHER", "Diğer"],
] as const;

export function BusinessRemovalForm({
  business,
  defaultEmail,
}: {
  business: {
    id: string;
    name: string;
    city: string | null;
    district: string | null;
  };
  defaultEmail: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [verificationType, setVerificationType] =
    useState<PublicClaimVerificationType>("PHONE");
  const [reason, setReason] =
    useState<(typeof REMOVAL_REASONS)[number][0]>("NO_CONSENT");
  const [explanation, setExplanation] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [authorized, setAuthorized] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitBusinessRemovalRequest({
        businessId: business.id,
        contactName,
        relationship,
        phone,
        email,
        verificationType,
        reason,
        explanation,
        evidenceUrl,
        authorized,
      });

      if (result.success) {
        setDone(result.message ?? "Talebiniz alındı.");
      } else {
        setError(result.message ?? "Talep gönderilemedi.");
      }
    });
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="size-10 text-success-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">{done}</p>
        </CardContent>
      </Card>
    );
  }

  const location = [business.district, business.city].filter(Boolean).join(" · ");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-surface-cream px-4 py-4">
        <p className="font-semibold">{business.name}</p>
        {location && (
          <p className="mt-1 text-sm text-muted-foreground">{location}</p>
        )}
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="removal-contact">Yetkili kişi *</Label>
            <Input
              id="removal-contact"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="removal-relationship">İşletmeyle ilişkiniz *</Label>
            <Input
              id="removal-relationship"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              placeholder="Sahibi, yöneticisi, yetkili temsilcisi"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="removal-phone">Telefon</Label>
            <Input
              id="removal-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={20}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="removal-email">E-posta *</Label>
            <Input
              id="removal-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={200}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="removal-reason">Kaldırma nedeni *</Label>
            <select
              id="removal-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as typeof reason)
              }
              className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {REMOVAL_REASONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="removal-verification">Doğrulama yöntemi *</Label>
            <select
              id="removal-verification"
              value={verificationType}
              onChange={(event) =>
                setVerificationType(
                  event.target.value as PublicClaimVerificationType,
                )
              }
              className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PUBLIC_CLAIM_VERIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CLAIM_VERIFICATION_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="removal-explanation">Açıklama *</Label>
          <Textarea
            id="removal-explanation"
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            placeholder="Sayfanın neden kaldırılması gerektiğini ve doğrulama için bilinmesi gerekenleri yazın."
            required
            minLength={20}
            maxLength={1000}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            En az 20 karakter. Telefon numarası, kimlik numarası gibi gereksiz
            kişisel verileri yazmayın.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="removal-evidence">Kanıt bağlantısı</Label>
          <Input
            id="removal-evidence"
            type="url"
            value={evidenceUrl}
            onChange={(event) => setEvidenceUrl(event.target.value)}
            placeholder="https://..."
            maxLength={500}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(event) => setAuthorized(event.target.checked)}
            required
            className="mt-0.5 size-4 rounded border-input accent-foreground"
          />
          <span>
            Bu işletme adına talepte bulunmaya yetkili olduğumu ve verdiğim
            bilgilerin doğru olduğunu beyan ederim.
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            Talep doğrulanır; sayfa otomatik olarak kaldırılmaz.
          </p>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Kaldırma talebi gönder
          </Button>
        </div>
      </div>
    </form>
  );
}
