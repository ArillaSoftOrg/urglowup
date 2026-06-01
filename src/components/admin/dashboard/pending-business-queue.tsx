import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdminDashboardMetrics } from "@/lib/queries/admin";
import { PendingBusinessRow } from "./_pending-business-row";

interface PendingBusinessQueueProps {
  items: AdminDashboardMetrics["pendingBusinessQueue"];
}

export function PendingBusinessQueue({ items }: PendingBusinessQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardAction>
          <Link href="/admin/businesses" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            compact
            headline="No pending approvals"
            description="Queue is clear"
            icon={CheckCircle2}
          />
        ) : (
          <div className="space-y-3">
            {items.map((business) => (
              <PendingBusinessRow key={business.id} business={business} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
