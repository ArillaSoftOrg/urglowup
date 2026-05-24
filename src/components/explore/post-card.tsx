"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, CalendarDays, MessageSquare, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExplorePost } from "@/lib/queries/posts";

interface PostCardProps {
  post: ExplorePost;
  isLoggedIn: boolean;
  savedByCurrentUser: boolean;
  onSaveToggle: (postId: string, currentlySaved: boolean) => void;
}

export function PostCard({
  post,
  isLoggedIn,
  savedByCurrentUser,
  onSaveToggle,
}: PostCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const firstMedia = post.media[activeIndex] ?? post.media[0];
  const isVideo = firstMedia?.type === "VIDEO";

  // Pause/play video based on viewport intersection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [activeIndex]);

  function handleSave() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    onSaveToggle(post.id, savedByCurrentUser);
  }

  return (
    <div
      ref={cardRef}
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      {/* Media area */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {firstMedia ? (
          isVideo ? (
            <video
              ref={videoRef}
              src={firstMedia.url}
              className="size-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={firstMedia.url}
              alt={post.description ?? "Gönderi görseli"}
              fill
              className="object-cover"
              sizes="(max-width: 480px) 100vw, 480px"
            />
          )
        ) : (
          <div className="size-full bg-muted" />
        )}

        {/* Dot indicators for multiple media */}
        {post.media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {post.media.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  i === activeIndex
                    ? "scale-125 bg-white"
                    : "bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        {/* Category chip */}
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {post.category.name}
          </span>
        )}
      </div>

      {/* Business meta */}
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <Link href={`/b/${post.business.slug}`} className="shrink-0">
          <Avatar className="size-8">
            {post.business.logoUrl && (
              <AvatarImage
                src={post.business.logoUrl}
                alt={post.business.name}
              />
            )}
            <AvatarFallback className="text-xs">
              {post.business.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/b/${post.business.slug}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {post.business.name}
          </Link>
          {post.relatedService && (
            <p className="truncate text-xs text-muted-foreground">
              {post.relatedService.name}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {post.description && (
        <p className="line-clamp-2 px-3 pt-1.5 text-sm text-muted-foreground">
          {post.description}
        </p>
      )}

      {/* Action row */}
      <div className="flex items-center gap-1 p-3 pt-2">
        <button
          onClick={handleSave}
          aria-label={savedByCurrentUser ? "Kaydı kaldır" : "Kaydet"}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            savedByCurrentUser
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <Heart
            className={cn(
              "size-3.5",
              savedByCurrentUser && "fill-rose-500 text-rose-500"
            )}
          />
          Kaydet
        </button>

        <Link
          href={isLoggedIn ? `/b/${post.business.slug}/book` : "/login"}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <CalendarDays className="size-3.5" />
          Randevu al
        </Link>

        <Link
          href={isLoggedIn ? "/account/messages" : "/login"}
          className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          Mesaj
        </Link>

        <Link
          href={`/b/${post.business.slug}`}
          className="ml-auto flex items-center gap-1 rounded-lg bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
