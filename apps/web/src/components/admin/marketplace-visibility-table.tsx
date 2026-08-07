"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Globe, Loader2 } from "lucide-react";
import Link from "next/link";
import { toggleMarketplaceVisibility } from "@/app/(admin)/admin/actions";
import type { AdminBusiness } from "@/lib/queries/admin";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MarketplaceRow({ business }: { business: AdminBusiness }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleMarketplaceVisibility(business.id);
    });
  }

  return (
    <div className="flex items-center justify-between border-b p-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/businesses/${business.id}`}
            className="font-medium hover:underline"
          >
            {business.name}
          </Link>
          <Badge
            className={
              business.isMarketplaceVisible
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
          >
            {business.isMarketplaceVisible ? "Visible" : "Hidden"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {business.city ?? "No city"} · Added {formatDate(business.createdAt)}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
        className="shrink-0"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : business.isMarketplaceVisible ? (
          <>
            <EyeOff className="size-4" />
            Hide
          </>
        ) : (
          <>
            <Eye className="size-4" />
            Show
          </>
        )}
      </Button>
    </div>
  );
}

export function MarketplaceVisibilityTable({
  businesses,
}: {
  businesses: AdminBusiness[];
}) {
  const visible = businesses.filter((b) => b.isMarketplaceVisible);
  const hidden = businesses.filter((b) => !b.isMarketplaceVisible);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{visible.length}</span>{" "}
          visible
        </span>
        <span>
          <span className="font-medium text-foreground">{hidden.length}</span>{" "}
          hidden
        </span>
        <span>
          <span className="font-medium text-foreground">
            {businesses.length}
          </span>{" "}
          total
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {businesses.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Globe className="size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No marketplace businesses yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Businesses appear here once their status is set to Active
                (Marketplace).
              </p>
            </div>
          ) : (
            businesses.map((b) => <MarketplaceRow key={b.id} business={b} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
