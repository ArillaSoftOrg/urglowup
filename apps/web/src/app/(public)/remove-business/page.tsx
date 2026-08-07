import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BusinessRemovalForm } from "@/components/claim/business-removal-form";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "İşletme Sayfası Kaldırma Talebi",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ businessId?: string }>;
}

function UnavailableState() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Kaldırma talebi</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bu işletme için şu anda kaldırma talebi alınamıyor.
      </p>
      <Link
        href="/explore"
        className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
      >
        Keşfete dön
      </Link>
    </div>
  );
}

export default async function RemoveBusinessPage({ searchParams }: PageProps) {
  const { businessId } = await searchParams;
  if (!businessId) return <UnavailableState />;

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      district: true,
      ownerId: true,
      ownershipStatus: true,
      status: true,
      isMarketplaceVisible: true,
    },
  });

  const eligible =
    business &&
    business.ownerId === null &&
    business.ownershipStatus === "UNCLAIMED" &&
    business.status === "ACTIVE_MARKETPLACE" &&
    business.isMarketplaceVisible;

  if (!eligible) return <UnavailableState />;

  const user = await getCurrentUser();
  if (!user) {
    const target = `/remove-business?businessId=${encodeURIComponent(business.id)}`;
    redirect(`/login?redirect_url=${encodeURIComponent(target)}`);
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/b/${business.slug}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        İşletme sayfasına dön
      </Link>

      <div className="mt-4">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="size-4" />
          Doğrulamalı talep
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Bu sayfanın kaldırılmasını iste
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          İşletme kapandıysa, kayıt tekrarsa veya yayınlanmasını istemiyorsanız
          talep gönderebilirsiniz. UrGlowUp bilgileri doğrular; sayfa yalnızca
          yönetici onayından sonra yayından kaldırılır.
        </p>
      </div>

      <div className="mt-8">
        <BusinessRemovalForm
          business={{
            id: business.id,
            name: business.name,
            city: business.city,
            district: business.district,
          }}
          defaultEmail={user.email}
        />
      </div>
    </main>
  );
}
