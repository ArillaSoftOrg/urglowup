import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { ProfileEditForm } from "@/components/business/profile-edit-form";

export const metadata = { title: "İşletme Profili" };

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
      address: true,
      city: true,
      district: true,
      status: true,
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
    address: business.address,
    city: business.city,
    district: business.district,
    status: business.status,
    categoryName: business.categories[0]?.category.name ?? null,
  };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="İşletme Profili"
        description="Herkese açık işletme bilgilerinizi güncelleyin."
      />
      <ProfileEditForm business={profileData} />
    </div>
  );
}
