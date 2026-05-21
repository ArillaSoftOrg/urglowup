import Link from "next/link";
import type { MarketplaceCategory } from "@/lib/queries/marketplace";
import { getCategoryLabel } from "@/lib/category-labels";
import { CATEGORY_ICONS } from "@/lib/category-icons";

// Deterministic gradient fallback when no imageUrl or colorHex
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
  const { name, slug, imageUrl, colorHex, iconName, businessCount } = category;
  const gradient = pickGradient(name);
  const IconComponent = iconName && CATEGORY_ICONS[iconName as keyof typeof CATEGORY_ICONS];

  return (
    <Link
      href={`/category/${slug}`}
      className="group relative block w-full overflow-hidden rounded-xl shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] w-full">
        {/* Background: image, color, or gradient fallback */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : colorHex ? (
          <div
            className="size-full"
            style={{ background: `linear-gradient(135deg, ${colorHex}90, ${colorHex})` }}
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {/* Icon badge — top-left */}
        {IconComponent && (
          <div
            className="absolute left-2.5 top-2.5 flex size-9 items-center justify-center rounded-full shadow-sm sm:size-10"
            style={colorHex ? { backgroundColor: colorHex } : { backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          >
            <IconComponent className="size-[18px] text-white sm:size-5" />
          </div>
        )}

        {/* Text overlay — bottom */}
        <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5">
          <p className="truncate text-[15px] font-semibold leading-tight text-white drop-shadow-sm">
            {getCategoryLabel(slug, name)}
          </p>
          <p className="mt-0.5 text-[12px] text-white/85">
            {businessCount} işletme
          </p>
        </div>

        {/* Inset ring for definition */}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
      </div>
    </Link>
  );
}
