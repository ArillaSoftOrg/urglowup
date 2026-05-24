import Link from "next/link";
import { cn } from "@/lib/utils";

interface StyleTagCardProps {
  name: string;
  slug: string;
  postCount: number;
  className?: string;
}

export function StyleTagCard({ name, slug, postCount, className }: StyleTagCardProps) {
  return (
    <Link
      href={`/styles/${slug}`}
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
