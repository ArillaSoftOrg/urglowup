import { requireBusiness } from "@/lib/auth";
import { getBusinessReviews, getBusinessReviewStats } from "@/lib/queries/reviews";
import { BusinessReviewList } from "@/components/business/review-list";
import { BusinessPageHeader } from "@/components/business/business-page-header";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const { businessId } = await requireBusiness();

  const [reviews, stats] = await Promise.all([
    getBusinessReviews(businessId),
    getBusinessReviewStats(businessId),
  ]);

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Reviews"
        description="See what your customers are saying."
      />
      <BusinessReviewList reviews={reviews} stats={stats} />
    </div>
  );
}
