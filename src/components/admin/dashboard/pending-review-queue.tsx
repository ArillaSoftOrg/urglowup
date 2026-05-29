import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdminDashboardMetrics } from "@/lib/queries/admin";
import { PendingReviewRow } from "./_pending-review-row";

interface PendingReviewQueueProps {
  items: AdminDashboardMetrics["pendingReviewQueue"];
}

export function PendingReviewQueue({ items }: PendingReviewQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Reviews</CardTitle>
        <CardAction>
          <Link href="/admin/reviews" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            compact
            headline="No pending reviews"
            description="Queue is clear"
            icon={CheckCircle2}
          />
        ) : (
          <div className="space-y-3">
            {items.map((review) => (
              <PendingReviewRow key={review.id} review={review} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
