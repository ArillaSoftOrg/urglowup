"use client";

import { useActionState } from "react";
import {
  updateBusinessProfile,
  type ProfileActionState,
} from "@/app/(business)/business/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CircleCheck, CreditCard, Link, MapPin, PawPrint, Phone } from "lucide-react";

interface BusinessProfileData {
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagramUrl: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  slug: string;
  status: string;
  instantConfirmation: boolean;
  inAppPayment: boolean;
  petFriendly: boolean;
  categoryName?: string | null;
}

function FieldError({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
}

const profileFeatureOptions = [
  {
    name: "instantConfirmation",
    label: "Anında onay",
    description: "Müşteriler uygun saat seçtiğinde randevu otomatik onaylanır.",
    icon: CircleCheck,
  },
  {
    name: "inAppPayment",
    label: "Uygulama ile öde",
    description: "Müşterilere uygulama içinden ödeme alabileceğinizi gösterir.",
    icon: CreditCard,
  },
  {
    name: "petFriendly",
    label: "Evcil hayvan uygundur",
    description: "Mekanın evcil hayvan kabul ettiğini profilinizde belirtir.",
    icon: PawPrint,
  },
] as const;

export function ProfileEditForm({ business }: { business: BusinessProfileData }) {
  const initial: ProfileActionState = { success: false };
  const [state, formAction, isPending] = useActionState(updateBusinessProfile, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/15 p-3 text-sm text-success-foreground">
          <Check className="size-4 shrink-0" />
          {state.message}
        </div>
      )}
      {!state.success && state.message && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temel Bilgiler</CardTitle>
          <CardDescription>Herkese açık profilinizde görünen işletme adı ve açıklaması.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">İşletme Adı <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              name="name"
              defaultValue={business.name}
              placeholder="örn. Güzellik Stüdyom"
              className="mt-1.5"
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="name" />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={business.description ?? ""}
              placeholder="Müşterilere işletmeniz ve uzmanlıklarınız hakkında bilgi verin..."
              className="mt-1.5 min-h-[100px] resize-none"
              maxLength={1000}
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="description" />
          </div>

          <div className="rounded-xl bg-surface-cream p-3">
            <p className="text-xs font-medium text-muted-foreground">Kategori</p>
            <div className="mt-1 flex items-center gap-2">
              {business.categoryName ? (
                <Badge variant="secondary">{business.categoryName}</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Kategori seçilmedi</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ek Bilgiler</CardTitle>
          <CardDescription>Uygun olan seçenekleri işaretleyin; public işletme sayfanızda açılış saatlerinin yanında görünür.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {profileFeatureOptions.map((option) => {
              const Icon = option.icon;
              const defaultChecked = business[option.name];

              return (
                <label
                  key={option.name}
                  htmlFor={option.name}
                  className="flex cursor-pointer gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-surface-cream"
                >
                  <input
                    id={option.name}
                    name={option.name}
                    type="checkbox"
                    defaultChecked={defaultChecked}
                    className="mt-1 size-4 accent-foreground"
                  />
                  <span className="space-y-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon className="size-4" />
                      {option.label}
                    </span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="size-4" />
            İletişim Bilgileri
          </CardTitle>
          <CardDescription>Müşterilerin size nasıl ulaşabileceği.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={business.phone ?? ""}
                placeholder="+90 555 000 0000"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="phone" />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={business.whatsapp ?? ""}
                placeholder="+90 555 000 0000"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="whatsapp" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" />
            Konum
          </CardTitle>
          <CardDescription>Herkese açık profilinizde gösterilen işletme adresi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Cadde / Sokak</Label>
            <Input
              id="address"
              name="address"
              defaultValue={business.address ?? ""}
              placeholder="Atatürk Cad. No:1 Kat:3"
              className="mt-1.5"
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="address" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                name="city"
                defaultValue={business.city ?? ""}
                placeholder="Istanbul"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="city" />
            </div>
            <div>
              <Label htmlFor="district">İlçe / Semt</Label>
              <Input
                id="district"
                name="district"
                defaultValue={business.district ?? ""}
                placeholder="Kadıköy"
                className="mt-1.5"
              />
              <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="district" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="size-4" />
            Sosyal Medya
          </CardTitle>
          <CardDescription>Sosyal medya profillerinizi ekleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="instagramUrl">Instagram Bağlantısı</Label>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              defaultValue={business.instagramUrl ?? ""}
              placeholder="https://instagram.com/yourbusiness"
              className="mt-1.5"
            />
            <FieldError errors={state.success ? undefined : (state as { errors?: Record<string, string[]> }).errors} name="instagramUrl" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Profili Kaydet"}
        </Button>
      </div>
    </form>
  );
}
