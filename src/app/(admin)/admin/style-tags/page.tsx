import { getAdminStyleTags } from "@/lib/queries/style-tags";
import { getAdminCategories } from "@/lib/queries/admin";
import { StyleTagManager } from "@/components/admin/style-tag-manager";

export const metadata = { title: "Admin - Style Tags" };

export default async function AdminStyleTagsPage() {
  const [styleTags, categories] = await Promise.all([
    getAdminStyleTags(),
    getAdminCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Style Tags</h1>
        <p className="text-muted-foreground">
          Manage style tags for the İlham feed and Style Atlas. Tags with linked posts cannot be deleted — deactivate them instead.
        </p>
      </div>
      <StyleTagManager styleTags={styleTags} categories={categories} />
    </div>
  );
}
