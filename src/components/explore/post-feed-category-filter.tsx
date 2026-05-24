"use client";

import { cn } from "@/lib/utils";

interface StyleTagData {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  postCount: number;
}

interface PostFeedCategoryFilterProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  selectedCategoryId: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
  // Style tag row
  styleTags: StyleTagData[];
  selectedStyleTagId: string | undefined;
  onStyleTagSelect: (styleTagId: string | undefined) => void;
}

const scrollClass =
  "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

export function PostFeedCategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
  styleTags,
  selectedStyleTagId,
  onStyleTagSelect,
}: PostFeedCategoryFilterProps) {
  // Visible style tags: if a category is selected, show only matching tags;
  // otherwise show the top-15 by post count.
  const visibleStyleTags = selectedCategoryId
    ? styleTags.filter((t) => t.categoryId === selectedCategoryId)
    : styleTags
        .slice()
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 15);

  return (
    <div className="space-y-2">
      {/* Row 1 — category pills */}
      {categories.length > 0 && (
        <div className={scrollClass}>
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
      )}

      {/* Row 2 — style tag pills */}
      {visibleStyleTags.length > 0 && (
        <div className={scrollClass}>
          <button
            onClick={() => onStyleTagSelect(undefined)}
            className={cn(
              "shrink-0 snap-start rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !selectedStyleTagId
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            Tümü
          </button>
          {visibleStyleTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onStyleTagSelect(tag.id)}
              className={cn(
                "shrink-0 snap-start rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedStyleTagId === tag.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
