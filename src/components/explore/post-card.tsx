"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Play,
  MessageSquare,
  Volume2,
  VolumeX,
} from "lucide-react";
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
  const businessInitial = post.business.name.charAt(0).toUpperCase();
  const [activeIndex, setActiveIndex] = useState(0);
  const [inlineVideoEnabled, setInlineVideoEnabled] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoCanPlay, setVideoCanPlay] = useState(false);

  // Responsive media height cap; server render falls back to a mobile-friendly default.
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
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [activeIndex, inlineVideoEnabled]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function handleSlideChange(index: number) {
    if (index === activeIndex) return;
    videoRef.current?.pause();
    setActiveIndex(index);
    setInlineVideoEnabled(false);
    setVideoCanPlay(false);
  }

  function goNext() {
    if (activeIndex < post.media.length - 1) handleSlideChange(activeIndex + 1);
  }

  function goPrev() {
    if (activeIndex > 0) handleSlideChange(activeIndex - 1);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const delta = event.changedTouches[0].clientX - touchStartX.current;
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
        <div className="w-10 shrink-0 pt-0.5">
          <Link href={`/b/${post.business.slug}`} tabIndex={-1}>
            <div className="relative size-10 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten">
              {post.business.logoUrl ? (
                <Image
                  src={post.business.logoUrl}
                  alt={post.business.name}
                  width={40}
                  height={40}
                  className="size-full object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  {businessInitial}
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="min-w-0 flex-1">
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

          {post.description && (
            <p className="mb-1.5 text-sm leading-relaxed text-foreground">
              {post.description}
            </p>
          )}

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

          {post.media.length > 0 && (
            <div
              className="mb-2"
              onTouchStart={hasMultiple ? handleTouchStart : undefined}
              onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label="Gorseli buyut"
                className={cn(
                  "relative mx-auto cursor-pointer overflow-hidden rounded-xl",
                  isVideo && "bg-black"
                )}
                style={mediaContainerStyle}
                onClick={() => onMediaClick(activeIndex)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onMediaClick(activeIndex);
                  }
                }}
              >
                {isVideo ? (
                  <>
                    {inlineVideoEnabled ? (
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
                    ) : currentMedia.posterUrl ? (
                      <Image
                        src={currentMedia.posterUrl}
                        alt={post.description ?? "Video onizlemesi"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 480px) 100vw, 480px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-black" />
                    )}
                    {inlineVideoEnabled && !videoCanPlay && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </div>
                    )}
                    {!inlineVideoEnabled && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setInlineVideoEnabled(true);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
                        aria-label="Videoyu oynat"
                      >
                        <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                          <Play className="ml-0.5 size-5 fill-current" />
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMuted((value) => !value);
                      }}
                      className={cn(
                        "absolute bottom-3 right-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-black/80",
                        !inlineVideoEnabled && "hidden"
                      )}
                      aria-label={muted ? "Sesi ac" : "Sesi kapat"}
                    >
                      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                  </>
                ) : ar ? (
                  <Image
                    src={currentMedia.url}
                    alt={post.description ?? "Gonderi gorseli"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                ) : (
                  <Image
                    src={currentMedia.url}
                    alt={post.description ?? "Gonderi gorseli"}
                    width={600}
                    height={600}
                    className="block h-auto w-full object-contain"
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                )}

                {hasMultiple && (
                  <>
                    <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      {activeIndex + 1}/{post.media.length}
                    </div>
                    {activeIndex > 0 && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          goPrev();
                        }}
                        className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70 sm:flex"
                        aria-label="Onceki"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                    )}
                    {activeIndex < post.media.length - 1 && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
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

          <div className="-ml-1.5 flex items-center gap-4 pb-1 pt-0.5">
            <button
              type="button"
              onClick={handleSave}
              aria-label={savedByCurrentUser ? "Kaydi kaldir" : "Kaydet"}
              className={cn(
                "group flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-rose-500",
                savedByCurrentUser && "text-rose-500"
              )}
            >
              <Heart
                className={cn(
                  "size-4 transition-transform group-hover:scale-110",
                  savedByCurrentUser && "fill-rose-500"
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
              title="Mesaj gonder"
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
