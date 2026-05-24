"use client";

import { cn } from "@/lib/utils";

interface PostFeedCategoryFilterProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  selectedCategoryId: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}

export function PostFeedCategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: PostFeedCategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        onClick={() => onSelect(undefined)}
        className={cn(
          "shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !selectedCategoryId
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-muted-foreground hover:text-foreground"
        )}
      >
        Tümü
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            selectedCategoryId === cat.id
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
