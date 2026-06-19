"use client";

import { useTransition, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  MoreHorizontal,
  Loader2,
  Building2,
  Search,
  ArrowUpDown,
  Zap,
} from "lucide-react";
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
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { computeBusinessSignals } from "@/lib/admin/business-signals";
import { ViolationSummaryChip } from "./violation-summary-chip";
import type { AdminBusiness } from "@/lib/queries/admin";

function formatLastActive(date: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}m ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function buildProfileCompletionData(business: AdminBusiness) {
  return {
    name: business.name,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    city: business.city,
    address: business.address,
    coverImageUrl: business.coverImageUrl,
    logoUrl: business.logoUrl,
    categories: business.categories.map((c) => ({ categoryId: c.categoryId })),
    services: business.services.map((s) => ({ id: s.id })),
    hours: business.hours.map((h) => ({ id: h.id })),
    media: business.media.map((m) => ({ id: m.id })),
  };
}

function ProfileBadge({ score }: { score: number }) {
  if (score >= 90) {
    return <Badge variant="success" className="text-xs">{score}%</Badge>;
  }
  if (score >= 60) {
    return <Badge variant="warning" className="text-xs">{score}%</Badge>;
  }
  return <Badge variant="destructive" className="text-xs">{score}%</Badge>;
}

function RatingBadge({
  ratingStats,
}: {
  ratingStats: AdminBusiness["ratingStats"] | null;
}) {
  if (!ratingStats || ratingStats.bayesianScore === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium">
        {ratingStats.bayesianScore.toFixed(1)}
      </span>
      <span className="text-xs text-muted-foreground">
        ({ratingStats.rawReviewCount})
      </span>
    </div>
  );
}

function RiskBadge({ business }: { business: AdminBusiness }) {
  const signals = computeBusinessSignals(business);
  if (signals.risks.length === 0) {
    return null;
  }

  const highRiskCount = signals.risks.filter((r) => r.severity === "high")
    .length;

  return (
    <Badge
      variant="outline"
      className={
        highRiskCount > 0
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-warning/30 bg-warning/10 text-warning-foreground"
      }
    >
      <AlertCircle className="size-3 mr-1" />
      {signals.risks.length}
    </Badge>
  );
}

type SortField = "name" | "profile" | "rating" | "bookings" | "reviews" | "lastActive";

function BusinessRow({ business }: { business: AdminBusiness }) {
  const [isPending, startTransition] = useTransition();
  const transitions = ADMIN_STATUS_TRANSITIONS[business.status];
  const completion = calculateProfileCompletion(
    buildProfileCompletionData(business)
  );

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
    <div className="flex items-center justify-between border-b p-3 last:border-0 hover:bg-muted/50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Link
            href={`/admin/businesses/${business.id}`}
            className="font-medium hover:underline truncate"
          >
            {business.name}
          </Link>
          <Badge className={`text-xs ${BUSINESS_STATUS_COLORS[business.status]}`}>
            {BUSINESS_STATUS_LABELS[business.status]}
          </Badge>
          <RiskBadge business={business} />
          {business.priorViolations > 0 && (
            <ViolationSummaryChip
              total={business.priorViolations}
              reviews={business.violationsByType?.reviews ?? 0}
              media={business.violationsByType?.media ?? 0}
              posts={business.violationsByType?.posts ?? 0}
              size="sm"
            />
          )}
        </div>

        <div className="grid grid-cols-6 gap-4 text-xs text-muted-foreground mb-2">
          <div>
            <span className="font-medium">Profile:</span> <ProfileBadge score={completion.score} />
          </div>
          <div>
            <span className="font-medium">Rating:</span> <RatingBadge ratingStats={business.ratingStats} />
          </div>
          <div>
            <span className="font-medium">Bookings:</span> {business._count.appointments}
          </div>
          <div>
            <span className="font-medium">Reviews:</span> {business._count.reviews}
          </div>
          <div>
            <span className="font-medium">Media:</span> {business._count.media}
          </div>
          <div>
            <span className="font-medium">Last Active:</span> {formatLastActive(business.lastActivityAt)}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {ownerName || business.owner.email} &middot; {business.city ?? "No city"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 ml-2 flex-shrink-0" />}>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const pending = businesses.filter((b) => b.status === "PENDING_APPROVAL");
  const active = businesses.filter(
    (b) => b.status === "ACTIVE_PRIVATE" || b.status === "ACTIVE_MARKETPLACE"
  );
  const suspended = businesses.filter((b) => b.status === "SUSPENDED");
  const rejected = businesses.filter((b) => b.status === "REJECTED");

  const needsAttention = useMemo(() => {
    return active.filter((b) => {
      const signals = computeBusinessSignals(b);
      return signals.risks.length > 0;
    });
  }, [active]);

  const filterBySearch = (items: AdminBusiness[]) => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.owner.email.toLowerCase().includes(term) ||
        (b.owner.firstName?.toLowerCase().includes(term) ?? false) ||
        (b.owner.lastName?.toLowerCase().includes(term) ?? false)
    );
  };

  const sortItems = (items: AdminBusiness[]) => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "profile":
          aVal = calculateProfileCompletion(
            buildProfileCompletionData(a)
          ).score;
          bVal = calculateProfileCompletion(
            buildProfileCompletionData(b)
          ).score;
          break;
        case "rating":
          aVal = a.ratingStats?.bayesianScore ?? -1;
          bVal = b.ratingStats?.bayesianScore ?? -1;
          break;
        case "bookings":
          aVal = a._count.appointments;
          bVal = b._count.appointments;
          break;
        case "reviews":
          aVal = a._count.reviews;
          bVal = b._count.reviews;
          break;
        case "lastActive":
          aVal = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          bVal = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal === null) aVal = -1;
      if (bVal === null) bVal = -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const numA = typeof aVal === "string" ? parseFloat(aVal) : aVal;
      const numB = typeof bVal === "string" ? parseFloat(bVal) : bVal;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    return sorted;
  };

  const renderTabContent = (items: AdminBusiness[]) => {
    const filtered = filterBySearch(items);
    const sorted = sortItems(filtered);

    return (
      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Building2 className="size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No businesses found
              </p>
            </div>
          ) : (
            sorted.map((b) => <BusinessRow key={b.id} business={b} />)
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="gap-2" />}>
            <ArrowUpDown className="size-4" />
            Sort: {sortBy === "name" ? "Name" : sortBy === "profile" ? "Profile" : sortBy === "rating" ? "Rating" : sortBy === "bookings" ? "Bookings" : sortBy === "reviews" ? "Reviews" : "Last Active"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["name", "profile", "rating", "bookings", "reviews", "lastActive"] as const).map((field) => (
              <DropdownMenuItem
                key={field}
                onClick={() => {
                  if (sortBy === field) {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(field);
                    setSortOrder("asc");
                  }
                }}
              >
                {field === "name"
                  ? "Name"
                  : field === "profile"
                  ? "Profile %"
                  : field === "rating"
                  ? "Rating"
                  : field === "bookings"
                  ? "Bookings"
                  : field === "reviews"
                  ? "Reviews"
                  : "Last Active"}
                {sortBy === field && (
                  <span className="ml-2">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-1">
            All ({businesses.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1">
            Active ({active.length})
          </TabsTrigger>
          {needsAttention.length > 0 && (
            <TabsTrigger value="needsAttention" className="gap-1">
              <Zap className="size-3" />
              Attention ({needsAttention.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="suspended" className="gap-1">
            Suspended ({suspended.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1">
            Rejected ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderTabContent(businesses)}
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          {renderTabContent(pending)}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderTabContent(active)}
        </TabsContent>
        {needsAttention.length > 0 && (
          <TabsContent value="needsAttention" className="mt-4">
            {renderTabContent(needsAttention)}
          </TabsContent>
        )}
        <TabsContent value="suspended" className="mt-4">
          {renderTabContent(suspended)}
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          {renderTabContent(rejected)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
