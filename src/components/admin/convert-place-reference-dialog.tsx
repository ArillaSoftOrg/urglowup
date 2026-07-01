"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { adminConvertPlaceReferenceToBusiness } from "@/app/(admin)/admin/place-references/actions";
import type { AdminPlaceReference } from "@/lib/queries/admin";

type ConvertRecord = Pick<
  AdminPlaceReference,
  "id" | "provider" | "providerPlaceId" | "city" | "district" | "categoryHint"
>;

type CategoryOption = { id: string; name: string; slug: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ConvertPlaceReferenceDialog({
  record,
  categories,
}: {
  record: ConvertRecord;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // NOTE: All form fields start EMPTY. PlaceReference context (below) is
  // read-only display and is intentionally NOT copied into these inputs.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [instantConfirmation, setInstantConfirmation] = useState(false);
  const [inAppPayment, setInAppPayment] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [maxGroupBookingGuests, setMaxGroupBookingGuests] = useState(4);

  function resetForm() {
    setName("");
    setDescription("");
    setPhone("");
    setWhatsapp("");
    setInstagramUrl("");
    setFacebookUrl("");
    setTiktokUrl("");
    setCity("");
    setDistrict("");
    setAddress("");
    setCategoryIds([]);
    setOwnerEmail("");
    setInstantConfirmation(false);
    setInAppPayment(false);
    setPetFriendly(false);
    setMaxGroupBookingGuests(4);
    setError(null);
  }

  function handleOpen() {
    resetForm();
    setOpen(true);
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminConvertPlaceReferenceToBusiness({
        placeReferenceId: record.id,
        name,
        description,
        phone,
        whatsapp,
        instagramUrl,
        facebookUrl,
        tiktokUrl,
        city,
        district,
        address,
        categoryIds,
        ownerEmail,
        instantConfirmation,
        inAppPayment,
        petFriendly,
        maxGroupBookingGuests,
      });
      if (res.success && res.businessId) {
        setOpen(false);
        router.push(`/admin/businesses/${res.businessId}`);
      } else {
        setError(res.message ?? "Bir hata oluştu.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-xs"
        onClick={handleOpen}
      >
        Business&apos;a Dönüştür
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Business&apos;a Dönüştür</DialogTitle>
          </DialogHeader>

          {/* Read-only PlaceReference context — NOT copied into form inputs */}
          <div className="my-4 rounded-md border bg-muted/40 p-3 text-xs space-y-1">
            <p className="font-medium text-muted-foreground">Yer Referansı (salt okunur)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
              <span className="text-muted-foreground">Provider:</span>
              <span>{record.provider}</span>
              <span className="text-muted-foreground">Place ID:</span>
              <span className="truncate" title={record.providerPlaceId}>{record.providerPlaceId}</span>
              <span className="text-muted-foreground">Şehir:</span>
              <span>{record.city ?? "—"}</span>
              <span className="text-muted-foreground">İlçe:</span>
              <span>{record.district ?? "—"}</span>
              <span className="text-muted-foreground">Kategori İpucu:</span>
              <span>{record.categoryHint ?? "—"}</span>
            </div>
            <p className="pt-1 text-[11px] text-muted-foreground">
              Bu değerler yalnızca referanstır. İşletme bilgilerini aşağıda manuel girin.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="İşletme Adı *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                autoFocus
              />
            </Field>
            <Field label="Açıklama">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefon">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
              </Field>
              <Field label="WhatsApp">
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
              </Field>
              <Field label="Instagram">
                <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} maxLength={200} placeholder="@kullanici" />
              </Field>
              <Field label="Facebook">
                <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} maxLength={200} placeholder="@kullanici" />
              </Field>
              <Field label="TikTok">
                <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} maxLength={200} placeholder="@kullanici" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Şehir">
                <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
              </Field>
              <Field label="İlçe">
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} maxLength={100} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Adres">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} />
                </Field>
              </div>
            </div>

            {categories.length > 0 && (
              <Field label="Kategoriler">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={categoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </Field>
            )}

            <Field label="Sahip E-postası (boş bırakılırsa Sahipsiz)">
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                maxLength={200}
                placeholder="ornek@email.com"
              />
            </Field>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-primary" checked={instantConfirmation} onChange={(e) => setInstantConfirmation(e.target.checked)} />
                <span className="text-sm">Anlık Onay</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-primary" checked={inAppPayment} onChange={(e) => setInAppPayment(e.target.checked)} />
                <span className="text-sm">Uygulama İçi Ödeme</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-primary" checked={petFriendly} onChange={(e) => setPetFriendly(e.target.checked)} />
                <span className="text-sm">Evcil Hayvan Dostu</span>
              </label>
            </div>

            <Field label="Maksimum Grup Rezervasyonu">
              <Input
                type="number"
                value={maxGroupBookingGuests}
                onChange={(e) => setMaxGroupBookingGuests(Number(e.target.value))}
                min={1}
                max={20}
                className="w-24"
              />
            </Field>

            {error && (
              <p className="text-xs text-destructive border border-destructive/30 bg-destructive/10 rounded px-2 py-1">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
              İptal
            </DialogClose>
            <Button type="submit" disabled={isPending || name.trim().length < 2}>
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Dönüştür
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
