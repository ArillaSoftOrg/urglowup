"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExplorePost } from "@/lib/queries/posts";

interface PostMediaViewerProps {
  media: ExplorePost["media"];
  initialIndex: number;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function PostMediaViewer({
  media,
  initialIndex,
  onClose,
}: PostMediaViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const currentMedia = media[activeIndex] ?? media[0];
  const isVideo = currentMedia?.type === "VIDEO";
  const hasMultiple = media.length > 1;

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    const y = window.scrollY;
    document.body.style.cssText = `overflow:hidden;position:fixed;top:-${y}px;width:100%`;
    return () => {
      document.body.style.cssText = "";
      window.scrollTo(0, y);
    };
  }, []);

  // ── Browser back button support ───────────────────────────────────────────
  useEffect(() => {
    history.pushState({ postViewer: true }, "");

    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  // ── Focus management ──────────────────────────────────────────────────────
  useEffect(() => {
    backButtonRef.current?.focus();
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
        case "Backspace":
          history.back();
          break;
        case "ArrowLeft":
          if (activeIndex > 0) {
            setActiveIndex((i) => i - 1);
            resetVideoState();
          }
          break;
        case "ArrowRight":
          if (activeIndex < media.length - 1) {
            setActiveIndex((i) => i + 1);
            resetVideoState();
          }
          break;
        case " ":
          e.preventDefault();
          if (isVideo) togglePlayPause();
          break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, media.length, isVideo]);

  // ── Video events ──────────────────────────────────────────────────────────
  function onTimeUpdate() {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }
  function onLoadedMetadata() {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.play().catch(() => {});
    }
  }
  function onPlay() {
    setIsPlaying(true);
  }
  function onPause() {
    setIsPlaying(false);
  }

  function resetVideoState() {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.currentTime = val;
    setCurrentTime(val);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
      resetVideoState();
    }
  }, [activeIndex]);

  const goNext = useCallback(() => {
    if (activeIndex < media.length - 1) {
      setActiveIndex((i) => i + 1);
      resetVideoState();
    }
  }, [activeIndex, media.length]);

  // ── Touch swipe ───────────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      // Down swipe → dismiss
      history.back();
    } else if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe → navigate
      if (dx < 0) goNext();
      else goPrev();
    }
  }

  // ── Image aspect ──────────────────────────────────────────────────────────
  const mw = currentMedia?.width;
  const mh = currentMedia?.height;
  const ar = mw && mh ? mw / mh : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Medya görüntüleyici"
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top bar ── */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button
          ref={backButtonRef}
          onClick={() => history.back()}
          aria-label="Geri"
          className="flex items-center justify-center rounded-full p-2 text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft className="size-5" />
        </button>

        {hasMultiple && (
          <span className="ml-auto text-sm text-white/60">
            {activeIndex + 1} / {media.length}
          </span>
        )}
      </div>

      {/* ── Media area ── */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {isVideo ? (
          <video
            key={activeIndex}
            ref={videoRef}
            src={currentMedia.url}
            className="max-h-full max-w-full"
            playsInline
            autoPlay
            muted={muted}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onPlay={onPlay}
            onPause={onPause}
          />
        ) : ar ? (
          <div
            className="relative max-h-full max-w-full"
            style={{
              aspectRatio: `${mw} / ${mh}`,
              width: "100%",
              maxHeight: "100%",
            }}
          >
            <Image
              src={currentMedia.url}
              alt="Gönderi görseli"
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={activeIndex}
            src={currentMedia.url}
            alt="Gönderi görseli"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {/* Prev / Next arrows — desktop only */}
        {hasMultiple && (
          <>
            {activeIndex > 0 && (
              <button
                onClick={goPrev}
                aria-label="Önceki"
                className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:flex"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            {activeIndex < media.length - 1 && (
              <button
                onClick={goNext}
                aria-label="Sonraki"
                className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:flex"
              >
                <ChevronRight className="size-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Video controls (only for VIDEO) ── */}
      {isVideo && (
        <div className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleScrub}
            className={cn(
              "w-full cursor-pointer appearance-none",
              "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
              "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full",
              "[&::-webkit-slider-runnable-track]:bg-white/30",
              // progress fill via inline gradient
            )}
            style={{
              background: `linear-gradient(to right, white ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.25) 0%)`,
              height: "4px",
              borderRadius: "2px",
            }}
            aria-label="Video konumu"
          />

          {/* Controls row */}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Duraklat" : "Oynat"}
              className="text-white transition-colors hover:text-white/80"
            >
              {isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !muted;
                  setMuted((m) => !m);
                }
              }}
              aria-label={muted ? "Sesi aç" : "Sesi kapat"}
              className="text-white transition-colors hover:text-white/80"
            >
              {muted ? (
                <VolumeX className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </button>

            <span className="ml-auto font-mono text-xs tabular-nums text-white/60">
              {formatTime(currentTime)}
              {duration > 0 && ` / ${formatTime(duration)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
