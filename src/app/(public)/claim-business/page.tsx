import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClaimBusinessForm } from "@/components/claim/claim-business-form";

export const metadata: Metadata = {
  title: "İşletme Başvurusu",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ placeReferenceId?: string; businessId?: string }>;
}

export default async function ClaimBusinessPage({ searchParams }: PageProps) {
  const { placeReferenceId, businessId } = await searchParams;

  if ((!placeReferenceId && !businessId) || (placeReferenceId && businessId)) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">İşletme Başvurusu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Geçersiz başvuru bağlantısı.
        </p>
      </div>
    );
  }

  const [placeReference, business] = await Promise.all([
    placeReferenceId
      ? db.placeReference.findUnique({
          where: { id: placeReferenceId },
          select: {
            id: true,
            provider: true,
            status: true,
            claimedBusinessId: true,
            categoryHint: true,
            city: true,
            district: true,
          },
        })
      : null,
    businessId
      ? db.business.findUnique({
          where: { id: businessId },
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            ownerId: true,
            ownershipStatus: true,
            status: true,
          },
        })
      : null,
  ]);

  const eligible =
    (placeReference &&
      placeReference.provider === "GOOGLE" &&
      placeReference.status === "APPROVED" &&
      placeReference.claimedBusinessId === null) ||
    (business &&
      business.ownerId === null &&
      business.ownershipStatus === "UNCLAIMED" &&
      business.status !== "SUSPENDED" &&
      business.status !== "REJECTED");

  if (!eligible) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">İşletme Başvurusu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu işletme için şu anda başvuru alınamıyor.
        </p>
      </div>
    );
  }

  // Auth gate — after eligibility so we don't bounce users to login for dead links.
  const user = await getCurrentUser();
  if (!user) {
    const target = placeReferenceId
      ? `/claim-business?placeReferenceId=${encodeURIComponent(placeReferenceId)}`
      : `/claim-business?businessId=${encodeURIComponent(businessId!)}`;
    redirect(`/auth/login?redirect_url=${encodeURIComponent(target)}`);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bu işletme sizin mi?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İşletmenizin sahipliğini talep etmek için aşağıdaki formu doldurun.
        </p>
      </div>

      <ClaimBusinessForm
        placeReference={
          placeReference
            ? {
                id: placeReference.id,
                categoryHint: placeReference.categoryHint,
                city: placeReference.city,
                district: placeReference.district,
                provider: placeReference.provider,
              }
            : undefined
        }
        business={
          business
            ? {
                id: business.id,
                name: business.name,
                city: business.city,
                district: business.district,
              }
            : undefined
        }
        defaultEmail={user.email}
      />
    </div>
  );
}
