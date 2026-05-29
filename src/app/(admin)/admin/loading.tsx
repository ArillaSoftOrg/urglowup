import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI grid skeleton — 8 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Alert strip skeleton */}
      <Skeleton className="h-10 rounded-xl" />

      {/* Queues skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-60 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>

      {/* Health row skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>

      {/* Activity feed skeleton */}
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
