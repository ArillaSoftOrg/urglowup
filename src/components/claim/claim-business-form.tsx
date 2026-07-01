"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitBusinessClaim } from "@/app/(public)/claim-business/actions";
import {
  CLAIM_VERIFICATION_LABELS,
  PUBLIC_CLAIM_VERIFICATION_TYPES,
  type PublicClaimVerificationType,
} from "@/lib/constants/claim";

type PlaceReferenceContext = {
  id: string;
  categoryHint: string | null;
  city: string | null;
  district: string | null;
  provider: string;
};

export function ClaimBusinessForm({
  placeReference,
  defaultEmail,
}: {
  placeReference: PlaceReferenceContext;
  defaultEmail: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [verificationType, setVerificationType] =
    useState<PublicClaimVerificationType>("PHONE");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitBusinessClaim({
        placeReferenceId: placeReference.id,
        businessName,
        contactName,
        phone,
        email,
        verificationType,
        evidenceUrl,
        note,
      });
      if (res.success) {
        setDone(res.message ?? "Başvurunuz alındı.");
      } else {
        setError(res.message ?? "Bir hata oluştu.");
      }
    });
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-green-600" />
          <p className="text-sm text-muted-foreground max-w-sm">{done}</p>
        </CardContent>
      </Card>
    );
  }

  const contextParts = [
    placeReference.categoryHint,
    placeReference.district,
    placeReference.city,
  ].filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yer Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            {contextParts.length > 0 ? contextParts.join(" · ") : "Google Maps işletmesi"}
          </p>
          <p className="mt-1 text-xs">
            İşletme bilgilerini aşağıda kendiniz girin. Başvurunuz incelenecektir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Başvuru Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="c-name">İşletme Adı *</Label>
            <Input
              id="c-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-contact">Yetkili Kişi *</Label>
            <Input
              id="c-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="c-phone">Telefon</Label>
              <Input
                id="c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-email">E-posta *</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-verify">Doğrulama Yöntemi *</Label>
            <select
              id="c-verify"
              value={verificationType}
              onChange={(e) =>
                setVerificationType(e.target.value as PublicClaimVerificationType)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PUBLIC_CLAIM_VERIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CLAIM_VERIFICATION_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-evidence">Kanıt Bağlantısı (opsiyonel)</Label>
            <Input
              id="c-evidence"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              maxLength={500}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-note">Ek Not (opsiyonel)</Label>
            <Textarea
              id="c-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Başvuruyu Gönder
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
