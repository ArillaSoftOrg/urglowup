import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { optimizeBusinessLogoUrl, optimizePostImageUrl } from "@/lib/optimized-media";
import type { ExplorePost } from "@/lib/queries/posts";

const COVER_GRADIENTS = [
  "from-rose-200 to-pink-300",
  "from-purple-200 to-violet-300",
  "from-sky-200 to-blue-300",
  "from-amber-200 to-orange-300",
  "from-teal-200 to-emerald-300",
  "from-stone-200 to-zinc-300",
];

function pickGradient(name: string): string {
  return COVER_GRADIENTS[name.charCodeAt(0) % COVER_GRADIENTS.length];
}

export function DealCard({ post, locale }: { post: ExplorePost; locale?: string }) {
  const { business, description, media, relatedService, category } = post;
  const prefix = locale && locale !== "tr" ? `/${locale}` : "";
  const cover = media[0];
  const gradient = pickGradient(business.name);
  const logoUrl = optimizeBusinessLogoUrl(undefined, business.logoUrl);

  return (
    <Link
      href={`${prefix}/b/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-shadow hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {cover ? (
          <Image
            src={optimizePostImageUrl(cover, cover.url)}
            alt={description ?? business.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`size-full bg-gradient-to-br ${gradient}`} />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
          <Tag className="size-3" />
          Fırsat
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-muted">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt={business.name}
                fill
                sizes="28px"
                className="object-cover"
              />
            )}
          </div>
          <p className="truncate text-sm font-semibold leading-tight">{business.name}</p>
        </div>

        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}

        {(relatedService || category) && (
          <p className="mt-auto truncate text-xs text-muted-foreground">
            {relatedService ? relatedService.name : category?.name}
          </p>
        )}
      </div>
    </Link>
  );
}

export function DealGrid({
  posts,
  locale,
}: {
  posts: ExplorePost[];
  locale?: string;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        headline="Şu anda yayında fırsat bulunmuyor"
        description="İşletmeler yeni kampanyalar paylaştığında burada görünecek."
        surface="cream"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {posts.map((post) => (
        <DealCard key={post.id} post={post} locale={locale} />
      ))}
    </div>
  );
}
