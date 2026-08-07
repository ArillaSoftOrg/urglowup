"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { adminCreateBusiness, adminUpdateBusiness } from "@/app/(admin)/admin/actions";
import type { AdminBusinessDetail, AdminCategory } from "@/lib/queries/admin";

type CategoryOption = Pick<AdminCategory, "id" | "name" | "slug">;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────

export function BusinessCreateForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminCreateBusiness({
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
        router.push(`/admin/businesses/${res.businessId}`);
      } else {
        setError(res.message ?? "Bir hata oluştu.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="İşletme Adı *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İşletme adı"
              required
              minLength={2}
              maxLength={100}
            />
          </Field>
          <Field label="Açıklama">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İşletme hakkında kısa açıklama"
              maxLength={2000}
              rows={4}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5xx xxx xx xx"
              maxLength={20}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+90 5xx xxx xx xx"
              maxLength={20}
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="@kullanici veya https://..."
              maxLength={200}
            />
          </Field>
          <Field label="Facebook">
            <Input
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="@kullanici veya https://..."
              maxLength={200}
            />
          </Field>
          <Field label="TikTok">
            <Input
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="@kullanici veya https://..."
              maxLength={200}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konum</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Şehir">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="İstanbul"
              maxLength={100}
            />
          </Field>
          <Field label="İlçe">
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Kadıköy"
              maxLength={100}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Adres">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tam adres"
                maxLength={500}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kategoriler</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sahip</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Sahip E-postası (boş bırakılırsa Sahipsiz oluşturulur)">
            <Input
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="ornek@email.com"
              type="email"
              maxLength={200}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ayarlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={instantConfirmation}
              onChange={(e) => setInstantConfirmation(e.target.checked)}
            />
            <span className="text-sm">Anlık Onay</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={inAppPayment}
              onChange={(e) => setInAppPayment(e.target.checked)}
            />
            <span className="text-sm">Uygulama İçi Ödeme</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={petFriendly}
              onChange={(e) => setPetFriendly(e.target.checked)}
            />
            <span className="text-sm">Evcil Hayvan Dostu</span>
          </label>
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
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          İşletme Oluştur
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
      </div>
    </form>
  );
}

// ─── Edit Form ────────────────────────────────────────────────

export function BusinessEditForm({
  business,
  categories,
}: {
  business: AdminBusinessDetail;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const existingCategoryIds = business.categories.map((c) => c.categoryId);

  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(business.whatsapp ?? "");
  const [instagramUrl, setInstagramUrl] = useState(business.instagramUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(business.facebookUrl ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(business.tiktokUrl ?? "");
  const [city, setCity] = useState(business.city ?? "");
  const [district, setDistrict] = useState(business.district ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(existingCategoryIds);
  const [instantConfirmation, setInstantConfirmation] = useState(business.instantConfirmation);
  const [inAppPayment, setInAppPayment] = useState(business.inAppPayment);
  const [petFriendly, setPetFriendly] = useState(business.petFriendly);
  const [maxGroupBookingGuests, setMaxGroupBookingGuests] = useState(business.maxGroupBookingGuests);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await adminUpdateBusiness({
        businessId: business.id,
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
        instantConfirmation,
        inAppPayment,
        petFriendly,
        maxGroupBookingGuests,
      });
      if (res.success) {
        router.push(`/admin/businesses/${business.id}`);
      } else {
        setError(res.message ?? "Bir hata oluştu.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Sahip: </span>
            {business.owner
              ? `${[business.owner.firstName, business.owner.lastName].filter(Boolean).join(" ") || "—"} (${business.owner.email})`
              : "Sahipsiz"}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Slug: </span>/b/{business.slug}
          </div>
          <Field label="İşletme Adı *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </Field>
          <Field label="Açıklama">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </Field>
          <Field label="WhatsApp">
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
          </Field>
          <Field label="Instagram">
            <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Facebook">
            <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} maxLength={200} />
          </Field>
          <Field label="TikTok">
            <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} maxLength={200} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konum</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kategoriler</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ayarlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={instantConfirmation}
              onChange={(e) => setInstantConfirmation(e.target.checked)}
            />
            <span className="text-sm">Anlık Onay</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={inAppPayment}
              onChange={(e) => setInAppPayment(e.target.checked)}
            />
            <span className="text-sm">Uygulama İçi Ödeme</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={petFriendly}
              onChange={(e) => setPetFriendly(e.target.checked)}
            />
            <span className="text-sm">Evcil Hayvan Dostu</span>
          </label>
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
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="text-sm text-green-700 border border-green-300 bg-green-50 rounded-md px-3 py-2">
          {successMsg}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Değişiklikleri Kaydet
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/admin/businesses/${business.id}`)}>
          İptal
        </Button>
      </div>
    </form>
  );
}
