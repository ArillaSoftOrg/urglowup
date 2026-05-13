import { requireBusiness } from "@/lib/auth";
import { getBusinessReviews, getBusinessReviewStats } from "@/lib/queries/reviews";
import { BusinessReviewList } from "@/components/business/review-list";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const { businessId } = await requireBusiness();

  const [reviews, stats] = await Promise.all([
    getBusinessReviews(businessId),
    getBusinessReviewStats(businessId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">
          See what your customers are saying.
        </p>
      </div>

      <BusinessReviewList reviews={reviews} stats={stats} />
    </div>
  );
}
