import Link from "next/link";
import { Star, MessageSquare, ImageOff } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminDashboardMetrics } from "@/lib/queries/admin";

interface PlatformHealthRowProps {
  metrics: AdminDashboardMetrics;
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function PlatformHealthRow({ metrics }: PlatformHealthRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Review Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-4" />
            Review Health
          </CardTitle>
          <CardAction>
            <Link href="/admin/reviews" className="text-xs text-primary hover:underline">
              View →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow
            label="Pending"
            value={metrics.reviewStatusCounts["PENDING"] ?? 0}
          />
          <StatRow
            label="Approved"
            value={metrics.reviewStatusCounts["APPROVED"] ?? 0}
          />
          <StatRow
            label="Hidden"
            value={metrics.reviewStatusCounts["HIDDEN"] ?? 0}
          />
          <StatRow
            label="Removed"
            value={metrics.reviewStatusCounts["REMOVED"] ?? 0}
          />
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-warning fill-warning" />
                <span className="text-xs text-muted-foreground">Platform Avg</span>
              </div>
              <span className="font-medium">
                {metrics.platformAvgRating?.toFixed(1) ?? "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageOff className="size-4" />
            Media Health
          </CardTitle>
          <CardAction>
            <Link href="/admin/media" className="text-xs text-primary hover:underline">
              View →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow
            label="Active"
            value={metrics.mediaStatusCounts["ACTIVE"] ?? 0}
          />
          <StatRow
            label="Hidden"
            value={metrics.mediaStatusCounts["HIDDEN"] ?? 0}
          />
          <StatRow
            label="Removed"
            value={metrics.mediaStatusCounts["REMOVED"] ?? 0}
          />
          {(metrics.mediaStatusCounts["HIDDEN"] ?? 0) +
            (metrics.mediaStatusCounts["REMOVED"] ?? 0) >
            0 && (
            <div className="border-t pt-2">
              <Badge variant="destructive" className="w-full justify-center">
                Attention needed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
