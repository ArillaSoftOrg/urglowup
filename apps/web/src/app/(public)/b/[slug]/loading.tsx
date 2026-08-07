import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessProfileLoading() {
  return (
    <>
      {/* Cover skeleton */}
      <Skeleton className="h-56 w-full rounded-none sm:h-72 lg:h-80" />

      <div className="container mx-auto px-4 py-6">
        {/* Logo skeleton */}
        <Skeleton className="-mt-14 size-28 rounded-2xl sm:-mt-16 sm:size-32" />

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Profile header */}
            <div className="space-y-3 pt-4">
              <Skeleton className="h-9 w-56 sm:w-72" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            {/* Services card */}
            <div className="rounded-xl border bg-card p-5">
              <Skeleton className="mb-4 h-5 w-24" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between gap-4 border-t py-4 first:border-t-0 first:pt-0">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
                </div>
              ))}
            </div>

            {/* Hours card */}
            <div className="rounded-xl border bg-card p-5">
              <Skeleton className="mb-4 h-5 w-32" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between py-1.5">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden w-80 shrink-0 lg:block">
            <div className="rounded-xl border bg-card p-5">
              <Skeleton className="mb-4 h-5 w-40" />
              <Skeleton className="mb-3 h-8 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
