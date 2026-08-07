import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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

export const metadata = { title: "Yorumlarım" };

interface PageProps {
  searchParams: Promise<{ write?: string }>;
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { write } = await searchParams;

  const [reviews, reviewableAppointments] = await Promise.all([
    getCustomerReviews(user.id),
    getReviewableAppointments(user.id),
  ]);

  const hasContent = reviews.length > 0 || reviewableAppointments.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yorumlarım</h1>
        <p className="text-muted-foreground">
          İşletmeler için yazdığınız yorumlar.
        </p>
      </div>

      {hasContent ? (
        <CustomerReviewList
          reviews={reviews}
          reviewableAppointments={reviewableAppointments}
          defaultOpenAppointmentId={write}
        />
      ) : (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Star className="size-6" />
            </div>
            <CardTitle>Henüz yorum yok</CardTitle>
            <CardDescription className="max-w-sm">
              Tamamlanan bir randevudan sonra işletme için yorum yazabilirsiniz. Yorumlarınız burada görünecek.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href="/account/appointments"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Randevuları görüntüle
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
