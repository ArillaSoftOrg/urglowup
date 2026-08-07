import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminBusinessDetail, getAdminCategories } from "@/lib/queries/admin";
import { BusinessEditForm } from "@/components/admin/business-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const business = await getAdminBusinessDetail(id);
  return {
    title: business ? `Admin - ${business.name} Düzenle` : "İşletme Bulunamadı",
  };
}

export default async function AdminBusinessEditPage({ params }: PageProps) {
  const { id } = await params;

  const [business, categories] = await Promise.all([
    getAdminBusinessDetail(id),
    getAdminCategories(),
  ]);

  if (!business) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/businesses" className="hover:underline">
            İşletmeler
          </Link>
          <span>/</span>
          <Link href={`/admin/businesses/${id}`} className="hover:underline">
            {business.name}
          </Link>
          <span>/</span>
          <span>Düzenle</span>
        </div>
        <h1 className="text-2xl font-bold">{business.name} — Düzenle</h1>
      </div>

      <BusinessEditForm business={business} categories={categories} />
    </div>
  );
}
