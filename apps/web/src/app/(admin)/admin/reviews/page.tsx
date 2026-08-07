import { getAdminReviews } from "@/lib/queries/admin";
import { ReviewModerationTable } from "@/components/admin/review-moderation-table";

export const metadata = { title: "Admin - Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <p className="text-muted-foreground">
          Approve, hide, or remove customer reviews. Only approved reviews
          appear on public business pages.
        </p>
      </div>
      <ReviewModerationTable reviews={reviews} />
    </div>
  );
}
