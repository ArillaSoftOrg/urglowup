import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getCustomerReviews,
  getReviewableAppointments,
} from "@/lib/queries/reviews";
import { CustomerReviewList } from "@/components/account/review-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";

export const metadata = { title: "My Reviews" };

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [reviews, reviewableAppointments] = await Promise.all([
    getCustomerReviews(user.id),
    getReviewableAppointments(user.id),
  ]);

  const hasContent = reviews.length > 0 || reviewableAppointments.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground">
          Reviews you&apos;ve written for businesses.
        </p>
      </div>

      {hasContent ? (
        <CustomerReviewList
          reviews={reviews}
          reviewableAppointments={reviewableAppointments}
        />
      ) : (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Star className="size-6" />
            </div>
            <CardTitle>No reviews yet</CardTitle>
            <CardDescription className="max-w-sm">
              After a completed appointment, you&apos;ll be able to leave a
              review for the business. Your reviews will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a
              href="/account/appointments"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View appointments
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
