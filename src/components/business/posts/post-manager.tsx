"use client";

import { PostCardBusiness } from "./post-card-business";
import { PostCreateDialog } from "./post-create-dialog";
import { LayoutGrid } from "lucide-react";
import type { PostStatus } from "@/generated/prisma/enums";

interface PostManagerProps {
  posts: Array<{
    id: string;
    description: string | null;
    status: PostStatus;
    createdAt: Date;
    media: Array<{ url: string; type: string; sortOrder: number }>;
  }>;
  services: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function PostManager({ posts, services, categories }: PostManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gönderiler</h1>
          <p className="text-sm text-muted-foreground">
            İşletmenizin görsel paylaşımları.
          </p>
        </div>
        <PostCreateDialog services={services} categories={categories} />
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <LayoutGrid className="size-10 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="font-medium">Henüz gönderi yok</p>
            <p className="text-sm text-muted-foreground">
              İlk gönderinizi paylaşın ve keşfet akışında görünün.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <PostCardBusiness key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
