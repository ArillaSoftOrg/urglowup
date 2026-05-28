"use client";

import { useCallback, useEffect, useOptimistic, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid } from "lucide-react";
import { PostCard } from "./post-card";
import { PostFeedCategoryFilter } from "./post-feed-category-filter";
import { PostMediaViewer } from "./post-media-viewer";
import { PersonalizationNudge } from "./personalization-nudge";
import type { ExplorePost } from "@/lib/queries/posts";

type StyleTagData = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  postCount: number;
};

interface PostFeedProps {
  initialPosts: ExplorePost[];
  initialNextCursor: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  isLoggedIn: boolean;
  showPersonalizationNudge?: boolean;
}

type ViewerState = {
  post: ExplorePost;
  mediaIndex: number;
} | null;

export function PostFeed({
  initialPosts,
  initialNextCursor,
  categories,
  isLoggedIn,
  showPersonalizationNudge = false,
}: PostFeedProps) {
  const [posts, setPosts] = useState<ExplorePost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedStyleTagId, setSelectedStyleTagId] = useState<string | undefined>(undefined);
  const [styleTags, setStyleTags] = useState<StyleTagData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewerState, setViewerState] = useState<ViewerState>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch style tags once on mount
  useEffect(() => {
    fetch("/api/style-tags")
      .then((r) => r.json())
      .then((data: StyleTagData[]) => setStyleTags(data))
      .catch(() => {});
  }, []);

  // Optimistic save state: map of postId -> savedByCurrentUser
  const [optimisticSaves, setOptimisticSaves] = useOptimistic<
    Record<string, boolean>,
    { postId: string; saved: boolean }
  >({}, (state, action) => ({
    ...state,
    [action.postId]: action.saved,
  }));

  function buildParams(extra?: Record<string, string>) {
    const params = new URLSearchParams({ take: "20" });
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (selectedStyleTagId) params.set("styleTagId", selectedStyleTagId);
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    return params;
  }

  // Reset feed when category changes
  async function handleCategorySelect(categoryId: string | undefined) {
    setSelectedCategoryId(categoryId);
    setSelectedStyleTagId(undefined);
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "20" });
      if (categoryId) params.set("categoryId", categoryId);
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  // Reset feed when style tag changes
  async function handleStyleTagSelect(styleTagId: string | undefined) {
    setSelectedStyleTagId(styleTagId);
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "20" });
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      if (styleTagId) params.set("styleTagId", styleTagId);
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  // Infinite scroll: load next page
  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = buildParams({ cursor: nextCursor });
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, loading, selectedCategoryId, selectedStyleTagId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  async function handleSaveToggle(postId: string, currentlySaved: boolean) {
    const nextSaved = !currentlySaved;
    setOptimisticSaves({ postId, saved: nextSaved });

    try {
      await fetch(`/api/posts/${postId}/save`, {
        method: nextSaved ? "POST" : "DELETE",
      });
      // Update the posts array so the persisted state is correct after next render
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, savedByCurrentUser: nextSaved } : p,
        ),
      );
    } catch {
      // Revert on error
      setOptimisticSaves({ postId, saved: currentlySaved });
    }
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <LayoutGrid className="size-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="font-medium">Henüz gönderi yok</p>
          <p className="text-sm text-muted-foreground">
            İşletmeler gönderi paylaştığında burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {showPersonalizationNudge && <PersonalizationNudge />}
        <PostFeedCategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={handleCategorySelect}
          styleTags={styleTags}
          selectedStyleTagId={selectedStyleTagId}
          onStyleTagSelect={handleStyleTagSelect}
        />

        <div className="mx-auto max-w-[480px]">
          {loading && posts.length === 0 ? (
            /* ── Loading skeleton (two-column) ── */
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse border-b border-border/60 py-3"
              >
                <div className="flex gap-2.5 px-4">
                  {/* Avatar placeholder */}
                  <div className="size-10 shrink-0 rounded-full bg-muted" />
                  {/* Content placeholder */}
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="flex gap-2">
                      <div className="h-3 w-28 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-52 rounded-xl bg-muted" />
                    <div className="flex gap-3 pt-1">
                      <div className="size-7 rounded-full bg-muted" />
                      <div className="size-7 rounded-full bg-muted" />
                      <div className="size-7 rounded-full bg-muted" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            posts.map((post) => {
              const saved =
                post.id in optimisticSaves
                  ? optimisticSaves[post.id]
                  : post.savedByCurrentUser;
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  isLoggedIn={isLoggedIn}
                  savedByCurrentUser={saved}
                  onSaveToggle={handleSaveToggle}
                  onMediaClick={(mediaIndex) =>
                    setViewerState({ post, mediaIndex })
                  }
                />
              );
            })
          )}
        </div>

        {nextCursor && (
          <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
        )}

        {loading && posts.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        )}
      </div>

      {/* ── Full-screen media viewer ── */}
      {viewerState &&
        createPortal(
          <PostMediaViewer
            media={viewerState.post.media}
            initialIndex={viewerState.mediaIndex}
            onClose={() => setViewerState(null)}
          />,
          document.body,
        )}
    </>
  );
}
