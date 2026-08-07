import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  ImageIcon,
  Link2,
  LogOut,
  Plug,
  Scissors,
  Settings,
  Star,
  Users2,
} from "lucide-react";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { signOutAction } from "@/app/(auth)/actions";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { ProfileEditForm } from "@/components/business/profile-edit-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Profil" };

const profileSections = [
  { title: "Hizmetler", href: "/business/services", icon: Scissors },
  { title: "Vitrin", href: "/business/media", icon: ImageIcon },
  { title: "Çalışma Saatleri", href: "/business/hours", icon: Clock },
  { title: "Değerlendirmeler", href: "/business/reviews", icon: Star },
  { title: "Ekip", href: "/business/team", icon: Users2 },
  { title: "Randevu Linki", href: "/business/public-link", icon: Link2 },
  { title: "Entegrasyonlar", href: "/business/integrations", icon: Plug },
  { title: "Ayarlar", href: "/business/settings", icon: Settings },
];

export default async function ProfilePage() {
  const { businessId } = await requireBusiness("MANAGER");

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      name: true,
      slug: true,
      description: true,
      phone: true,
      whatsapp: true,
      instagramUrl: true,
      facebookUrl: true,
      tiktokUrl: true,
      address: true,
      city: true,
      district: true,
      status: true,
      instantConfirmation: true,
      inAppPayment: true,
      petFriendly: true,
      wheelchairAccess: true,
      parkingAvailable: true,
      nearPublicTransit: true,
      categories: {
        include: { category: { select: { name: true } } },
        take: 1,
      },
    },
  });

  if (!business) notFound();

  const profileData = {
    name: business.name,
    slug: business.slug,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    instagramUrl: business.instagramUrl,
    facebookUrl: business.facebookUrl,
    tiktokUrl: business.tiktokUrl,
    address: business.address,
    city: business.city,
    district: business.district,
    status: business.status,
    instantConfirmation: business.instantConfirmation,
    inAppPayment: business.inAppPayment,
    petFriendly: business.petFriendly,
    wheelchairAccess: business.wheelchairAccess,
    parkingAvailable: business.parkingAvailable,
    nearPublicTransit: business.nearPublicTransit,
    categoryName: business.categories[0]?.category.name ?? null,
  };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Profil"
        description="İşletme vitrininizi, hizmetlerinizi ve yönetim ayarlarınızı buradan düzenleyin."
      />

      <section
        aria-label="Profil yönetimi kısayolları"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3"
      >
        {profileSections.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-[220px] shrink-0 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-xs transition-colors hover:bg-surface-cream sm:min-w-0"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-pink/12 text-brand-pink-foreground">
                <Icon className="size-4" />
              </span>
              {item.title}
            </Link>
          );
        })}
      </section>

      <ProfileEditForm business={profileData} />

      <form action={signOutAction}>
        <Button type="submit" variant="destructive">
          <LogOut className="size-4" />
          Çıkış Yap
        </Button>
      </form>
    </div>
  );
}
