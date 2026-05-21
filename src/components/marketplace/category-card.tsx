import Link from "next/link";
import type { MarketplaceCategory } from "@/lib/queries/marketplace";
import { getCategoryLabel } from "@/lib/category-labels";

// Deterministic gradient fallback when no imageUrl
const CATEGORY_GRADIENTS = [
  "from-rose-400 to-pink-600",
  "from-purple-400 to-violet-600",
  "from-sky-400 to-blue-600",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-600",
  "from-fuchsia-400 to-pink-600",
  "from-lime-400 to-green-500",
  "from-red-400 to-rose-600",
  "from-indigo-400 to-blue-600",
  "from-cyan-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-emerald-400 to-cyan-500",
];

function pickGradient(name: string): string {
  const index = name.charCodeAt(0) % CATEGORY_GRADIENTS.length;
  return CATEGORY_GRADIENTS[index];
}

export function CategoryCard({ category }: { category: MarketplaceCategory }) {
  const { name, slug, imageUrl, businessCount } = category;
  const gradient = pickGradient(name);

  return (
    <Link
      href={`/category/${slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-24 w-full overflow-hidden sm:h-28">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />
          </>
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium leading-tight">{getCategoryLabel(slug, name)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {businessCount} işletme
        </p>
      </div>
    </Link>
  );
}
