"use client";

import { useCallback, useEffect, useOptimistic, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { PostCard } from "./post-card";
import { PostFeedCategoryFilter } from "./post-feed-category-filter";
import type { ExplorePost } from "@/lib/queries/posts";

interface PostFeedProps {
  initialPosts: ExplorePost[];
  initialNextCursor: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  isLoggedIn: boolean;
}

export function PostFeed({
  initialPosts,
  initialNextCursor,
  categories,
  isLoggedIn,
}: PostFeedProps) {
  const [posts, setPosts] = useState<ExplorePost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Optimistic save state: map of postId -> savedByCurrentUser
  const [optimisticSaves, setOptimisticSaves] = useOptimistic<
    Record<string, boolean>,
    { postId: string; saved: boolean }
  >({}, (state, action) => ({
    ...state,
    [action.postId]: action.saved,
  }));

  // Reset feed when category changes
  async function handleCategorySelect(categoryId: string | undefined) {
    setSelectedCategoryId(categoryId);
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

  // Infinite scroll: load next page
  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor, take: "20" });
      if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, selectedCategoryId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
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
          p.id === postId ? { ...p, savedByCurrentUser: nextSaved } : p
        )
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
    <div className="space-y-4">
      <PostFeedCategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={handleCategorySelect}
      />

      <div className="mx-auto max-w-[480px] space-y-4">
        {loading && posts.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center gap-2.5 px-3 py-3">
                <div className="size-8 shrink-0 rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-2 w-20 rounded bg-muted" />
                </div>
              </div>
              <div className="mx-3 mb-3 h-3 rounded bg-muted" />
              <div className="h-64 w-full bg-muted" />
              <div className="flex gap-1 p-3 pt-2">
                <div className="h-7 w-16 rounded-lg bg-muted" />
                <div className="h-7 w-24 rounded-lg bg-muted" />
                <div className="h-7 w-16 rounded-lg bg-muted" />
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
  );
}
