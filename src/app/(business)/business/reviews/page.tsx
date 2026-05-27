import { requireBusiness } from "@/lib/auth";
import { getBusinessReviews, getBusinessReviewStats } from "@/lib/queries/reviews";
import { BusinessReviewList } from "@/components/business/review-list";
import { BusinessPageHeader } from "@/components/business/business-page-header";

export const metadata = { title: "Yorumlar" };

export default async function ReviewsPage() {
  const { businessId } = await requireBusiness();

  const [reviews, stats] = await Promise.all([
    getBusinessReviews(businessId),
    getBusinessReviewStats(businessId),
  ]);

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Yorumlar"
        description="Müşterilerinizin yorumlarını görüntüleyin."
      />
      <BusinessReviewList reviews={reviews} stats={stats} />
    </div>
  );
}
