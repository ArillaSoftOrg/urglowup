"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  CalendarDays,
  MessageSquare,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ExplorePost } from "@/lib/queries/posts";

interface PostCardProps {
  post: ExplorePost;
  isLoggedIn: boolean;
  savedByCurrentUser: boolean;
  onSaveToggle: (postId: string, currentlySaved: boolean) => void;
  onMediaClick: (mediaIndex: number) => void;
}

export function PostCard({
  post,
  isLoggedIn,
  savedByCurrentUser,
  onSaveToggle,
  onMediaClick,
}: PostCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);

  // Responsive media height cap — mobile-first, Twitter/X-like density.
  // Lazy initializer runs once on the client; server-side returns 320 (mobile default).
  const [maxMediaH] = useState<number>(() => {
    if (typeof window === "undefined") return 320;
    if (window.innerWidth >= 1024) return 480;
    if (window.innerWidth >= 640) return 400;
    return 320;
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef(0);

  const currentMedia = post.media[activeIndex] ?? post.media[0];
  const isVideo = currentMedia?.type === "VIDEO";
  const hasMultiple = post.media.length > 1;

  const mw = currentMedia?.width;
  const mh = currentMedia?.height;
  const ar = mw && mh ? mw / mh : null;

  const mediaContainerStyle: React.CSSProperties = ar
    ? {
        aspectRatio: `${mw} / ${mh}`,
        width: `min(100%, ${(maxMediaH * ar).toFixed(2)}px)`,
      }
    : {
        width: "100%",
        maxHeight: `${maxMediaH}px`,
      };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          obs.disconnect();
        }
      },
      { rootMargin: "500px 0px" },
    );
    obs.observe(card);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, [activeIndex, nearViewport]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function handleSlideChange(i: number) {
    if (i === activeIndex) return;
    videoRef.current?.pause();
    setActiveIndex(i);
    setVideoCanPlay(false);
  }

  const goNext = () => {
    if (activeIndex < post.media.length - 1) handleSlideChange(activeIndex + 1);
  };
  const goPrev = () => {
    if (activeIndex > 0) handleSlideChange(activeIndex - 1);
  };

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) goNext();
    else if (delta > 40) goPrev();
  }

  function handleSave() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    onSaveToggle(post.id, savedByCurrentUser);
  }

  return (
    <article
      ref={cardRef}
      className="border-b border-border/60 transition-colors hover:bg-accent/20"
    >
      <div className="flex gap-2.5 px-4 py-3">
        {/* ── Left column: avatar ── */}
        <div className="w-10 shrink-0 pt-0.5">
          <Link href={`/b/${post.business.slug}`} tabIndex={-1}>
            <Avatar className="size-10">
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
        </div>

        {/* ── Right column: all content ── */}
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <Link
              href={`/b/${post.business.slug}`}
              className="truncate text-sm font-semibold leading-tight hover:underline"
            >
              {post.business.name}
            </Link>
            {post.relatedService && (
              <span className="truncate text-xs text-muted-foreground">
                · {post.relatedService.name}
              </span>
            )}
            {post.category && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {post.category.name}
              </span>
            )}
          </div>

          {/* Description */}
          {post.description && (
            <p className="mb-1.5 text-sm leading-relaxed text-foreground">
              {post.description}
            </p>
          )}

          {/* Style Tags */}
          {post.styleTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {post.styleTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/styles/${tag.slug}`}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Media */}
          {post.media.length > 0 && (
            <div
              className="mb-2"
              onTouchStart={hasMultiple ? handleTouchStart : undefined}
              onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label="Görseli büyüt"
                className={cn(
                  "relative mx-auto overflow-hidden rounded-xl cursor-pointer",
                  isVideo && "bg-black",
                )}
                style={mediaContainerStyle}
                onClick={() => onMediaClick(activeIndex)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onMediaClick(activeIndex);
                  }
                }}
              >
                {isVideo ? (
                  <>
                    {nearViewport && (
                      <video
                        key={activeIndex}
                        ref={videoRef}
                        src={currentMedia.url}
                        className="block h-full w-full object-cover"
                        preload="metadata"
                        autoPlay
                        muted
                        loop
                        playsInline
                        onCanPlay={() => setVideoCanPlay(true)}
                        onWaiting={() => setVideoCanPlay(false)}
                      />
                    )}
                    {!videoCanPlay && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMuted((m) => !m);
                      }}
                      className="absolute bottom-3 right-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-black/80"
                      aria-label={muted ? "Sesi aç" : "Sesi kapat"}
                    >
                      {muted ? (
                        <VolumeX className="size-4" />
                      ) : (
                        <Volume2 className="size-4" />
                      )}
                    </button>
                  </>
                ) : ar ? (
                  <Image
                    src={currentMedia.url}
                    alt={post.description ?? "Gönderi görseli"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                ) : (
                  <Image
                    src={currentMedia.url}
                    alt={post.description ?? "Gönderi görseli"}
                    width={600}
                    height={600}
                    className="block h-auto w-full object-contain"
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                )}

                {/* Multi-media navigation */}
                {hasMultiple && (
                  <>
                    {/* Counter pill */}
                    <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      {activeIndex + 1}/{post.media.length}
                    </div>
                    {/* Left arrow — desktop only */}
                    {activeIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goPrev();
                        }}
                        className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70 sm:flex"
                        aria-label="Önceki"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                    )}
                    {/* Right arrow — desktop only */}
                    {activeIndex < post.media.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goNext();
                        }}
                        className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70 sm:flex"
                        aria-label="Sonraki"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="-ml-1.5 flex items-center gap-4 pb-1 pt-0.5">
            <button
              onClick={handleSave}
              aria-label={savedByCurrentUser ? "Kaydı kaldır" : "Kaydet"}
              className={cn(
                "group flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-rose-500",
                savedByCurrentUser && "text-rose-500",
              )}
            >
              <Heart
                className={cn(
                  "size-4 transition-transform group-hover:scale-110",
                  savedByCurrentUser && "fill-rose-500",
                )}
              />
            </button>

            <Link
              href={isLoggedIn ? `/b/${post.business.slug}/book` : "/login"}
              title="Randevu al"
              className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <CalendarDays className="size-4" />
            </Link>

            <Link
              href={isLoggedIn ? "/account/messages" : "/login"}
              title="Mesaj gönder"
              className="flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
