import Link from "next/link";
import { SearchX } from "lucide-react";

interface EmptyFilterStateProps {
  clearHref: string;
}

export function EmptyFilterState({ clearHref }: EmptyFilterStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="size-10 text-muted-foreground" />
      <p className="mt-3 font-medium">No professionals match your filters</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try adjusting your search or removing some filters.
      </p>
      <Link
        href={clearHref}
        className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
      >
        Clear all filters
      </Link>
    </div>
  );
}
