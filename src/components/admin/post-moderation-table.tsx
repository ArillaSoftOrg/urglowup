"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, EyeOff, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { ReasonGate } from "./reason-gate";
import { adminSetPostStatus } from "@/app/(admin)/admin/actions";
import type { AdminPost } from "@/lib/queries/admin";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  REAL_WORK: "Gerçek Çalışma",
  INSPIRATION: "İlham",
  EDUCATIONAL: "Eğitim",
  PROMOTION: "Kampanya",
};

import type { BadgeVariant } from "@/components/ui/badge";

const CONTENT_TYPE_VARIANT: Record<string, BadgeVariant> = {
  REAL_WORK: "success",
  INSPIRATION: "purple",
  EDUCATIONAL: "info",
  PROMOTION: "warning",
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  HIDDEN: "warning",
  REMOVED: "destructive",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PostRow({ post }: { post: AdminPost }) {
  const [isPending, startTransition] = useTransition();
  const [actionInProgress, setActionInProgress] = useState<"HIDDEN" | "REMOVED" | null>(null);

  function setStatus(status: "ACTIVE") {
    startTransition(async () => {
      await adminSetPostStatus(post.id, status);
    });
  }

  async function setStatusWithReason(status: "HIDDEN" | "REMOVED", reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await adminSetPostStatus(post.id, status, reason);
        setActionInProgress(null);
        resolve();
      });
    });
  }

  if (actionInProgress) {
    return (
      <tr className="border-b bg-muted/50">
        <td colSpan={7} className="px-4 py-3">
          <div className="max-w-[500px]">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{post.business.name}</p>
                {post.description && <p className="text-xs text-muted-foreground">{post.description}</p>}
              </div>
              <button
                onClick={() => setActionInProgress(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <ReasonGate
              onConfirm={(reason) => setStatusWithReason(actionInProgress, reason)}
              onCancel={() => setActionInProgress(null)}
              actionLabel={actionInProgress === "HIDDEN" ? "Hide" : "Remove"}
              isPending={isPending}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="max-w-[240px]">
          <Link
            href={`/b/${post.business.slug}`}
            target="_blank"
            className="font-medium text-foreground hover:underline"
          >
            {post.business.name}
          </Link>
          {post.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {post.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={CONTENT_TYPE_VARIANT[post.contentType] ?? "neutral"}>
          {CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[post.status] ?? "neutral"}>
          {post.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {post._count.media}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {post._count.saves}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(post.createdAt)}
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={isPending} className="size-8" />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.status !== "ACTIVE" && (
              <DropdownMenuItem onClick={() => setStatus("ACTIVE")}>
                <Eye className="mr-2 size-4" />
                Göster (ACTIVE)
              </DropdownMenuItem>
            )}
            {post.status !== "HIDDEN" && (
              <DropdownMenuItem onClick={() => setActionInProgress("HIDDEN")}>
                <EyeOff className="mr-2 size-4" />
                Gizle (HIDDEN)
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {post.status !== "REMOVED" && (
              <DropdownMenuItem
                onClick={() => setActionInProgress("REMOVED")}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Kaldır (REMOVED)
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

type FilterType = "ALL" | "REAL_WORK" | "INSPIRATION" | "EDUCATIONAL" | "PROMOTION";
type FilterStatus = "ALL" | "ACTIVE" | "HIDDEN" | "REMOVED";

export function PostModerationTable({ posts }: { posts: AdminPost[] }) {
  const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  const filtered = posts.filter((p) => {
    if (typeFilter !== "ALL" && p.contentType !== typeFilter) return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg border p-1">
          {(["ALL", "REAL_WORK", "INSPIRATION", "EDUCATIONAL", "PROMOTION"] as FilterType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "ALL" ? "Tümü" : CONTENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {(["ALL", "ACTIVE", "HIDDEN", "REMOVED"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "ALL" ? "Tüm Durumlar" : s}
            </button>
          ))}
        </div>
        <span className="self-center text-sm text-muted-foreground">
          {filtered.length} gönderi
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">İşletme / Açıklama</th>
              <th className="px-4 py-3 text-left font-medium">Tür</th>
              <th className="px-4 py-3 text-left font-medium">Durum</th>
              <th className="px-4 py-3 text-left font-medium">Medya</th>
              <th className="px-4 py-3 text-left font-medium">Kayıt</th>
              <th className="px-4 py-3 text-left font-medium">Tarih</th>
              <th className="px-4 py-3 text-left font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Bu filtreyle eşleşen gönderi yok.
                </td>
              </tr>
            ) : (
              filtered.map((post) => <PostRow key={post.id} post={post} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
