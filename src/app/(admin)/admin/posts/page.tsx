import { getAdminPosts } from "@/lib/queries/admin";
import { PostModerationTable } from "@/components/admin/post-moderation-table";

export const metadata = { title: "Admin - Posts" };

export default async function AdminPostsPage() {
  const posts = await getAdminPosts({ take: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate business posts. PROMOTION posts are already excluded from the İlham feed — use this page to hide or remove content that violates guidelines.
        </p>
      </div>
      <PostModerationTable posts={posts} />
    </div>
  );
}
