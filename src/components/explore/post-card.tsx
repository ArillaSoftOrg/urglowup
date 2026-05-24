"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart, CalendarDays, MessageSquare,
  Volume2, VolumeX, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ExplorePost } from "@/lib/queries/posts";

interface PostCardProps {
  post: ExplorePost;
  isLoggedIn: boolean;
  savedByCurrentUser: boolean;
  onSaveToggle: (postId: string, currentlySaved: boolean) => void;
}

const MAX_MEDIA_HEIGHT = 560;

export function PostCard({
  post,
  isLoggedIn,
  savedByCurrentUser,
  onSaveToggle,
}: PostCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);

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
        width: `min(100%, ${(MAX_MEDIA_HEIGHT * ar).toFixed(2)}px)`,
      }
    : {
        width: "100%",
        maxHeight: `${MAX_MEDIA_HEIGHT}px`,
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
      { rootMargin: "500px 0px" }
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
      { threshold: 0.5 }
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

  const goNext = () => { if (activeIndex < post.media.length - 1) handleSlideChange(activeIndex + 1); };
  const goPrev = () => { if (activeIndex > 0) handleSlideChange(activeIndex - 1); };

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) goNext();
    else if (delta > 40) goPrev();
  }

  function handleSave() {
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    onSaveToggle(post.id, savedByCurrentUser);
  }

  return (
    <div ref={cardRef} className="border-b border-border/60 py-4 transition-colors hover:bg-accent/20">
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 pb-2">
        <Link href={`/b/${post.business.slug}`} className="shrink-0">
          <Avatar className="size-9">
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
            className="block truncate text-sm font-semibold leading-tight hover:underline"
          >
            {post.business.name}
          </Link>
          {post.relatedService && (
            <p className="truncate text-xs leading-tight text-muted-foreground">
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

      {/* ── Description ── */}
      {post.description && (
        <p className="px-4 pb-2 text-sm leading-relaxed text-foreground">
          {post.description}
        </p>
      )}

      {/* ── Media ── */}
      {post.media.length > 0 && (
        <div
          className="mb-3 px-4"
          onTouchStart={hasMultiple ? handleTouchStart : undefined}
          onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-xl",
              isVideo && "bg-black cursor-pointer",
            )}
            style={mediaContainerStyle}
            onClick={isVideo ? () => setMuted((m) => !m) : undefined}
          >
            {isVideo ? (
              <>
                {nearViewport && (
                  <video
                    key={activeIndex}
                    ref={videoRef}
                    src={currentMedia.url}
                    className="block w-full h-full object-cover"
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
                  onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                  className="absolute bottom-3 right-3 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-black/80"
                  aria-label={muted ? "Sesi aç" : "Sesi kapat"}
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
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
                className="block w-full h-auto object-contain"
                sizes="(max-width: 480px) 100vw, 480px"
              />
            )}

            {/* ── Multi-media navigation ── */}
            {hasMultiple && (
              <>
                {/* Counter pill — top-right */}
                <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm pointer-events-none">
                  {activeIndex + 1}/{post.media.length}
                </div>

                {/* Left arrow — desktop only */}
                {activeIndex > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
                    aria-label="Önceki"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                )}
                {/* Right arrow — desktop only */}
                {activeIndex < post.media.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
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

      {/* ── Actions ── */}
      <div className="flex items-center gap-1 px-4">
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
          <Heart className={cn("size-3.5", savedByCurrentUser && "fill-rose-500 text-rose-500")} />
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
      </div>
    </div>
  );
}
