"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { MoreVertical, Trash2, EyeOff, Eye, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePost, updatePostStatus } from "@/app/(business)/business/posts/actions";
import type { PostStatus } from "@/generated/prisma/enums";

interface PostCardBusinessProps {
  post: {
    id: string;
    description: string | null;
    status: PostStatus;
    createdAt: Date;
    media: Array<{ url: string; type: string; sortOrder: number }>;
  };
}

export function PostCardBusiness({ post }: PostCardBusinessProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, startTransition] = useTransition();

  const firstMedia = post.media[0];
  const isVideo = firstMedia?.type === "VIDEO";

  function handleToggleStatus() {
    const next: PostStatus = post.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    startTransition(async () => {
      await updatePostStatus(post.id, next);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePost(post.id);
      setConfirmDelete(false);
    });
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border bg-card">
        {/* Thumbnail */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
          {firstMedia ? (
            isVideo ? (
              <video
                src={firstMedia.url}
                className="size-full object-cover"
                muted
                preload="metadata"
              />
            ) : (
              <Image
                src={firstMedia.url}
                alt="Gönderi görseli"
                fill
                className="object-cover"
              />
            )
          ) : (
            <div className="size-full bg-muted" />
          )}

          {isVideo && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              <Video className="size-3" />
              Video
            </span>
          )}

          {post.status === "HIDDEN" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Badge variant="secondary">Gizli</Badge>
            </div>
          )}

          {/* 3-dot menu */}
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                }
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {post.status === "ACTIVE" ? (
                    <>
                      <EyeOff className="mr-2 size-4" />
                      Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 size-4" />
                      Göster
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer */}
        {post.description && (
          <div className="p-3">
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {post.description}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gönderiyi sil</DialogTitle>
            <DialogDescription>
              Bu gönderi kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
