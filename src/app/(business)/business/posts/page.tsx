import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostManager } from "@/components/business/posts/post-manager";

export const metadata = { title: "Gönderiler" };

export default async function BusinessPostsPage() {
  const { businessId } = await requireBusiness("MANAGER");

  const [posts, services, categoryLinks] = await Promise.all([
    db.post.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: {
        media: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
    }),
    db.businessService.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.businessToCategory.findMany({
      where: { businessId },
      select: { category: { select: { id: true, name: true } } },
    }),
  ]);

  const categories = categoryLinks.map((c) => c.category);
  const categoryIds = categoryLinks.map((c) => c.category.id);

  const styleTags = await db.styleTag.findMany({
    where: {
      isActive: true,
      OR: [
        { categoryId: null },
        { categoryId: { in: categoryIds } },
      ],
    },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <PostManager
      posts={posts.map((p) => ({
        ...p,
        media: p.media.map((m) => ({ url: m.url, type: m.type, sortOrder: m.sortOrder })),
      }))}
      services={services}
      categories={categories}
      styleTags={styleTags}
    />
  );
}
