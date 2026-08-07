import { getAdminCategories } from "@/lib/queries/admin";
import { BusinessCreateForm } from "@/components/admin/business-form";
import Link from "next/link";

export const metadata = { title: "Admin - Yeni İşletme" };

export default async function AdminBusinessCreatePage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/admin/businesses" className="hover:underline">
            İşletmeler
          </Link>
          <span>/</span>
          <span>Yeni İşletme</span>
        </div>
        <h1 className="text-2xl font-bold">Yeni İşletme Oluştur</h1>
        <p className="text-muted-foreground">
          Sahipsiz veya sahipli olarak yeni bir işletme oluşturun.
        </p>
      </div>

      <BusinessCreateForm categories={categories} />
    </div>
  );
}
