"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateBusinessStatus } from "@/app/(admin)/admin/actions";
import type { AdminDashboardMetrics } from "@/lib/queries/admin";

interface PendingBusinessRowProps {
  business: AdminDashboardMetrics["pendingBusinessQueue"][number];
}

export function PendingBusinessRow({ business }: PendingBusinessRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await updateBusinessStatus(business.id, "ACTIVE_PRIVATE");
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await updateBusinessStatus(business.id, "REJECTED");
    });
  };

  return (
    <div className="flex items-start justify-between rounded-lg border border-border p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium">{business.name}</p>
        <p className="text-xs text-muted-foreground">
          {business.owner
            ? `${business.owner.firstName ?? ""} ${business.owner.lastName ?? ""} • ${business.owner.email}`.trim()
            : "Sahipsiz"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(business.createdAt), "MMM d")}
        </p>
      </div>
      <div className="flex gap-2 ml-2">
        <Button
          size="xs"
          variant="outline"
          onClick={handleApprove}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Approve"
          )}
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={handleReject}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "Reject"
          )}
        </Button>
      </div>
    </div>
  );
}
