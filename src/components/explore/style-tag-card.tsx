import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StyleTagCardProps {
  name: string;
  slug: string;
  postCount: number;
  coverUrl?: string | null;
  className?: string;
  locale?: string;
}

export function StyleTagCard({ name, slug, postCount, coverUrl, className, locale }: StyleTagCardProps) {
  const prefix = locale && locale !== "tr" ? `/${locale}` : "";
  if (coverUrl) {
    return (
      <Link
        href={`${prefix}/styles/${slug}`}
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-muted aspect-[4/3] block",
          className
        )}
      >
        <Image
          src={coverUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 480px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
          <p className="text-sm font-semibold text-white">#{name}</p>
          {postCount > 0 && (
            <p className="text-xs text-white/70">{postCount} gönderi</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`${prefix}/styles/${slug}`}
      className={cn(
        "flex items-center justify-between rounded-xl border bg-background px-4 py-3 transition-colors hover:bg-accent",
        className
      )}
    >
      <span className="text-sm font-medium">#{name}</span>
      {postCount > 0 && (
        <span className="text-xs text-muted-foreground">{postCount} gönderi</span>
      )}
    </Link>
  );
}
