import Image from "next/image";
import Link from "next/link";
import type { ExplorePost } from "@/lib/queries/posts";

interface StyleTagGuidePostGridProps {
  posts: ExplorePost[];
}

export function StyleTagGuidePostGrid({ posts }: StyleTagGuidePostGridProps) {
  if (posts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {posts.map((post) => {
        const media = post.media[0];
        return (
          <Link
            key={post.id}
            href={`/b/${post.business.slug}`}
            className="group relative overflow-hidden rounded-xl border bg-muted"
          >
            {media ? (
              <div className="relative aspect-square overflow-hidden">
                {media.type === "IMAGE" ? (
                  <Image
                    src={media.url}
                    alt={post.description ?? post.business.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 480px) 50vw, 33vw"
                  />
                ) : (
                  <video
                    src={media.url}
                    className="size-full object-cover"
                    muted
                    preload="metadata"
                    playsInline
                  />
                )}
              </div>
            ) : (
              <div className="aspect-square bg-muted" />
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
              <p className="truncate text-xs font-medium text-white">{post.business.name}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
