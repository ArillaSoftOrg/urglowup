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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Check,
  CircleCheck,
  CreditCard,
  Link,
  MapPin,
  PawPrint,
  Phone,
  Store,
  type LucideIcon,
} from "lucide-react";

interface BusinessProfileData {
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
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

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1.5 text-xs font-medium text-destructive">{msgs[0]}</p>;
}

function extractHandle(url: string | null, base: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+@?/, "");
  } catch {
    return url.replace(base, "").replace(/^@/, "");
  }
}

function SocialInput({
  id,
  name,
  prefix,
  defaultValue,
  placeholder,
  errors,
}: {
  id: string;
  name: string;
  prefix: string;
  defaultValue: string;
  placeholder: string;
  errors?: Record<string, string[]>;
}) {
  return (
    <div>
      <div className="mt-2 flex min-h-11 overflow-hidden rounded-lg border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <span className="flex shrink-0 items-center border-r border-border/70 bg-surface-cream px-3 text-sm font-medium text-muted-foreground select-none">
          {prefix}
        </span>
        <input
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/60 md:text-sm"
        />
      </div>
      <FieldError errors={errors} name={name} />
    </div>
  );
}

function SectionCard({
  id,
  number,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24 border-border/60 shadow-sm">
      <CardHeader className="gap-3 border-b border-border/50 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-purple text-brand-purple-foreground">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {number}
              </span>
              <span className="h-px flex-1 bg-border/60" />
            </div>
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <CardDescription className="mt-1 max-w-3xl leading-6">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-1">{children}</CardContent>
    </Card>
  );
}

const sectionLinks = [
  { href: "#basic-info", label: "Temel" },
  { href: "#features", label: "Ek bilgiler" },
  { href: "#contact", label: "İletişim" },
  { href: "#location", label: "Konum" },
  { href: "#social", label: "Sosyal" },
];

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
  const [state, formAction, isPending] = useActionState(
    updateBusinessProfile,
    initial
  );
  const formErrors = state.success
    ? undefined
    : (state as { errors?: Record<string, string[]> }).errors;

  return (
    <form action={formAction} className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <nav
        aria-label="Profil form bölümleri"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
      >
        {sectionLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground shadow-xs transition-colors hover:bg-surface-cream hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {state.success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/15 p-3 text-sm font-medium text-success-foreground"
        >
          <Check className="size-4 shrink-0" />
          {state.message}
        </div>
      )}
      {!state.success && state.message && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          {state.message}
        </div>
      )}

      <SectionCard
        id="basic-info"
        number="01"
        icon={Store}
        title="Temel Bilgiler"
        description="Profilinizin ilk izlenimini oluşturan işletme adı, açıklama ve kategori bilgileri."
      >
        <div>
          <Label htmlFor="name">
            İşletme Adı <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={business.name}
            placeholder="Örn. Güzellik Stüdyom"
            className="mt-2 min-h-11"
          />
          <FieldError errors={formErrors} name="name" />
        </div>

        <div>
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={business.description ?? ""}
            placeholder="Müşterilere işletmeniz ve uzmanlıklarınız hakkında bilgi verin."
            className="mt-2 min-h-32 resize-y"
            maxLength={1000}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Kısa, net ve hizmetlerinizi anlatan bir açıklama public profilde daha iyi çalışır.
          </p>
          <FieldError errors={formErrors} name="description" />
        </div>

        <div className="rounded-xl bg-surface-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kategori
          </p>
          <div className="mt-2 flex items-center gap-2">
            {business.categoryName ? (
              <Badge variant="secondary">{business.categoryName}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Kategori seçilmedi</span>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="features"
        number="02"
        icon={CircleCheck}
        title="Ek Bilgiler"
        description="Public işletme sayfanızda güven ve beklenti yönetimi sağlayan seçenekler."
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {profileFeatureOptions.map((option) => {
            const Icon = option.icon;
            const defaultChecked = business[option.name];

            return (
              <label
                key={option.name}
                htmlFor={option.name}
                className={cn(
                  "group flex min-h-28 cursor-pointer gap-3 rounded-xl border p-4 transition-colors",
                  defaultChecked
                    ? "border-brand-purple/40 bg-surface-purple"
                    : "border-border bg-background hover:bg-surface-cream"
                )}
              >
                <input
                  id={option.name}
                  name={option.name}
                  type="checkbox"
                  defaultChecked={defaultChecked}
                  className="mt-1 size-5 shrink-0 accent-foreground"
                />
                <span className="space-y-1.5">
                  <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Icon className="size-4 shrink-0 text-brand-purple-foreground" />
                    {option.label}
                  </span>
                  <span className="block text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        id="contact"
        number="03"
        icon={Phone}
        title="İletişim Bilgileri"
        description="Müşterilerin size doğrudan ulaşacağı telefon ve WhatsApp bilgileri."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={business.phone ?? ""}
              placeholder="+90 555 000 0000"
              className="mt-2 min-h-11"
            />
            <FieldError errors={formErrors} name="phone" />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              defaultValue={business.whatsapp ?? ""}
              placeholder="+90 555 000 0000"
              className="mt-2 min-h-11"
            />
            <FieldError errors={formErrors} name="whatsapp" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="location"
        number="04"
        icon={MapPin}
        title="Konum"
        description="Herkese açık profilinizde gösterilen işletme adresi ve bölge bilgisi."
      >
        <div>
          <Label htmlFor="address">Cadde / Sokak</Label>
          <Input
            id="address"
            name="address"
            defaultValue={business.address ?? ""}
            placeholder="Atatürk Cad. No:1 Kat:3"
            className="mt-2 min-h-11"
          />
          <FieldError errors={formErrors} name="address" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">Şehir</Label>
            <Input
              id="city"
              name="city"
              defaultValue={business.city ?? ""}
              placeholder="İstanbul"
              className="mt-2 min-h-11"
            />
            <FieldError errors={formErrors} name="city" />
          </div>
          <div>
            <Label htmlFor="district">İlçe / Semt</Label>
            <Input
              id="district"
              name="district"
              defaultValue={business.district ?? ""}
              placeholder="Kadıköy"
              className="mt-2 min-h-11"
            />
            <FieldError errors={formErrors} name="district" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="social"
        number="05"
        icon={Link}
        title="Sosyal Medya"
        description="Profilinizden yönlendirmek istediğiniz sosyal medya hesapları."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <div>
            <Label htmlFor="instagramUrl">Instagram</Label>
            <SocialInput
              id="instagramUrl"
              name="instagramUrl"
              prefix="instagram.com/"
              defaultValue={extractHandle(
                business.instagramUrl,
                "https://instagram.com/"
              )}
              placeholder="isletmeadi"
              errors={formErrors}
            />
          </div>
          <div>
            <Label htmlFor="facebookUrl">Facebook</Label>
            <SocialInput
              id="facebookUrl"
              name="facebookUrl"
              prefix="facebook.com/"
              defaultValue={extractHandle(
                business.facebookUrl,
                "https://facebook.com/"
              )}
              placeholder="sayfaadi"
              errors={formErrors}
            />
          </div>
          <div>
            <Label htmlFor="tiktokUrl">TikTok</Label>
            <SocialInput
              id="tiktokUrl"
              name="tiktokUrl"
              prefix="tiktok.com/@"
              defaultValue={extractHandle(
                business.tiktokUrl,
                "https://tiktok.com/@"
              )}
              placeholder="isletmeadi"
              errors={formErrors}
            />
          </div>
        </div>
      </SectionCard>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1500px] justify-end">
          <Button
            type="submit"
            variant="brand"
            size="lg"
            disabled={isPending}
            className="w-full md:w-auto"
          >
            {isPending ? "Kaydediliyor..." : "Profili Kaydet"}
          </Button>
        </div>
      </div>
    </form>
  );
}
