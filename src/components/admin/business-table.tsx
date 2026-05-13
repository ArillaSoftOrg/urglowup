"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import {
  updateBusinessStatus,
  toggleMarketplaceVisibility,
} from "@/app/(admin)/admin/actions";
import {
  BUSINESS_STATUS_LABELS,
  BUSINESS_STATUS_COLORS,
  ADMIN_STATUS_TRANSITIONS,
} from "@/lib/constants/business";
import type { AdminBusiness } from "@/lib/queries/admin";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BusinessRow({ business }: { business: AdminBusiness }) {
  const [isPending, startTransition] = useTransition();
  const transitions = ADMIN_STATUS_TRANSITIONS[business.status];

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateBusinessStatus(business.id, newStatus as AdminBusiness["status"]);
    });
  }

  function handleToggleMarketplace() {
    startTransition(async () => {
      await toggleMarketplaceVisibility(business.id);
    });
  }

  const ownerName = [business.owner.firstName, business.owner.lastName]
    .filter(Boolean)
    .join(" ");

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
          <Badge className={`text-xs ${BUSINESS_STATUS_COLORS[business.status]}`}>
            {BUSINESS_STATUS_LABELS[business.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {ownerName || business.owner.email} &middot; {business.city ?? "No city"}{" "}
          &middot; {formatDate(business.createdAt)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={`/admin/businesses/${business.id}`}>View Details</Link>
          </DropdownMenuItem>
          {transitions.length > 0 && <DropdownMenuSeparator />}
          {transitions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
            >
              {BUSINESS_STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
          {business.status === "ACTIVE_MARKETPLACE" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleMarketplace}>
                {business.isMarketplaceVisible
                  ? "Hide from Marketplace"
                  : "Show in Marketplace"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function BusinessTable({
  businesses,
}: {
  businesses: AdminBusiness[];
}) {
  const pending = businesses.filter((b) => b.status === "PENDING_APPROVAL");
  const active = businesses.filter(
    (b) => b.status === "ACTIVE_PRIVATE" || b.status === "ACTIVE_MARKETPLACE"
  );
  const suspended = businesses.filter((b) => b.status === "SUSPENDED");
  const rejected = businesses.filter((b) => b.status === "REJECTED");

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All ({businesses.length})</TabsTrigger>
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
        <TabsTrigger value="suspended">
          Suspended ({suspended.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejected.length})
        </TabsTrigger>
      </TabsList>

      {[
        { value: "all", items: businesses },
        { value: "pending", items: pending },
        { value: "active", items: active },
        { value: "suspended", items: suspended },
        { value: "rejected", items: rejected },
      ].map(({ value, items }) => (
        <TabsContent key={value} value={value} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Building2 className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No businesses found
                  </p>
                </div>
              ) : (
                items.map((b) => <BusinessRow key={b.id} business={b} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
