"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, CalendarDays, MessageSquare, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [muted, setMuted] = useState(true);
  // Tracks whether the current video slide has buffered enough to play
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeMedia = post.media[activeIndex] ?? post.media[0];
  const isVideo = activeMedia?.type === "VIDEO";
  const showVideoSpinner = isVideo && !videoCanPlay;

  // Viewport-based play/pause
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

  // React's muted prop doesn't reliably sync at runtime — set imperatively
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  function handleSlideChange(i: number) {
    setActiveIndex(i);
    setVideoCanPlay(false);
  }

  function handleSave() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    onSaveToggle(post.id, savedByCurrentUser);
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Business header */}
      <div className="flex items-center gap-2.5 px-3 py-3">
        <Link href={`/b/${post.business.slug}`} className="shrink-0">
          <Avatar className="size-8">
            {post.business.logoUrl && (
              <AvatarImage src={post.business.logoUrl} alt={post.business.name} />
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
        {post.category && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {post.category.name}
          </span>
        )}
      </div>

      {/* Description */}
      {post.description && (
        <p className="px-3 pb-3 text-sm leading-relaxed">
          {post.description}
        </p>
      )}

      {/* Media */}
      {post.media.length > 0 && (
        <div className="relative w-full overflow-hidden bg-black">
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={activeMedia.url}
                className="block w-full max-h-[560px] object-contain"
                autoPlay
                muted
                loop
                playsInline
                onClick={() => setMuted((m) => !m)}
                onCanPlay={() => setVideoCanPlay(true)}
                onWaiting={() => setVideoCanPlay(false)}
              />
              {showVideoSpinner && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                className="absolute bottom-3 right-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
                aria-label={muted ? "Sesi aç" : "Sesi kapat"}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </>
          ) : (
            <Image
              src={activeMedia.url}
              alt={post.description ?? "Gönderi görseli"}
              width={activeMedia.width ?? 600}
              height={activeMedia.height ?? 600}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "560px",
                objectFit: "contain",
                display: "block",
              }}
              sizes="(max-width: 480px) 100vw, 480px"
            />
          )}

          {/* Dot indicators for multiple media */}
          {post.media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSlideChange(i)}
                  className={cn(
                    "size-1.5 rounded-full transition-all",
                    i === activeIndex ? "scale-125 bg-white" : "bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
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
