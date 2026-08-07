import { getAdminCategories } from "@/lib/queries/admin";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "Admin - Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground">
          Manage business categories. Categories with linked businesses cannot
          be deleted.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
