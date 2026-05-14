import Link from "next/link";
import type { MarketplaceCategory } from "@/lib/queries/marketplace";
import { getCategoryLabel } from "@/lib/category-labels";

// Deterministic gradient fallback when no imageUrl
const CATEGORY_GRADIENTS = [
  "from-pink-100 to-rose-200",
  "from-purple-100 to-violet-200",
  "from-sky-100 to-blue-200",
  "from-amber-100 to-orange-200",
  "from-teal-100 to-emerald-200",
  "from-fuchsia-100 to-pink-200",
  "from-lime-100 to-green-200",
  "from-red-100 to-orange-200",
  "from-indigo-100 to-blue-200",
  "from-cyan-100 to-teal-200",
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
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-28 w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>
      <div className="p-3">
        <p className="font-medium leading-tight">{getCategoryLabel(slug, name)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {businessCount} işletme
        </p>
      </div>
    </Link>
  );
}
