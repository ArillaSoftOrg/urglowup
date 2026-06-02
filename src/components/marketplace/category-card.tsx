import Link from "next/link";
import Image from "next/image";
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

export function CategoryCard({
  category,
  locale,
}: {
  category: MarketplaceCategory;
  locale?: string;
}) {
  const { name, slug, imageUrl, colorHex, iconName } = category;
  const gradient = pickGradient(name);
  const IconComponent = iconName && CATEGORY_ICONS[iconName as keyof typeof CATEGORY_ICONS];
  const prefix = locale && locale !== "tr" ? `/${locale}` : "";

  return (
    <Link
      href={`${prefix}/category/${slug}`}
      className="group flex flex-col transition-transform active:scale-[0.98]"
    >
      {/* Media tile */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : colorHex ? (
          <div
            className="size-full"
            style={{ background: `linear-gradient(135deg, ${colorHex}90, ${colorHex})` }}
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
        {!imageUrl && IconComponent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <IconComponent className="size-8 text-white/80 sm:size-10" />
          </div>
        )}
      </div>

      {/* Text block */}
      <div className="flex flex-col gap-1 pt-2">
        <p className="line-clamp-1 text-sm font-semibold leading-tight">
          {getCategoryLabel(slug, name)}
        </p>
      </div>
    </Link>
  );
}
