import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 space-y-2 text-center">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-9 w-64" />
        <Skeleton className="mx-auto h-4 w-96 max-w-full" />
      </div>
      <div className="mb-8 rounded-2xl bg-surface-cream px-5 py-4">
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl">
            <Skeleton className="h-44 w-full" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
