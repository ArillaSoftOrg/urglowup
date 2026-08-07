import { Skeleton } from "@/components/ui/skeleton";

export default function BookPageLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>

      {/* Business chip */}
      <Skeleton className="mt-6 h-16 w-full rounded-xl" />

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-px w-6" />
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-px w-6" />
        <Skeleton className="size-7 rounded-full" />
      </div>

      {/* Service-list skeleton */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
