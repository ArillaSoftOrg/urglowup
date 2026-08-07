import { Skeleton } from "@/components/ui/skeleton";

export default function HomePageLoading() {
  return (
    <div className="flex flex-col">
      <section className="bg-background px-4 py-20 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton className="mx-auto h-3 w-32" />
          <Skeleton className="mx-auto mt-5 h-10 w-4/5 md:h-14" />
          <Skeleton className="mx-auto mt-2 h-10 w-1/2 md:h-14" />
          <Skeleton className="mx-auto mt-6 h-4 w-full max-w-lg" />
          <Skeleton className="mx-auto mt-2 h-4 w-3/4 max-w-lg" />
          <div className="mt-9 flex justify-center gap-3">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </section>
      <section className="bg-surface-cream px-4 py-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 px-6">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-surface-pink px-4 py-12 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="mb-8 h-8 w-48" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl">
                <Skeleton className="h-28 w-full rounded-none" />
                <div className="space-y-1.5 p-3">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
