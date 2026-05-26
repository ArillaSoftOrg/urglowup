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
import { adminSetPostStatus } from "@/app/(admin)/admin/actions";
import type { AdminPost } from "@/lib/queries/admin";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  REAL_WORK: "Gerçek Çalışma",
  INSPIRATION: "İlham",
  EDUCATIONAL: "Eğitim",
  PROMOTION: "Kampanya",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  REAL_WORK: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  INSPIRATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  EDUCATIONAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  PROMOTION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  HIDDEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  REMOVED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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

  function setStatus(status: "ACTIVE" | "HIDDEN" | "REMOVED") {
    startTransition(async () => {
      await adminSetPostStatus(post.id, status);
    });
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
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONTENT_TYPE_COLORS[post.contentType] ?? ""}`}>
          {CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status] ?? ""}`}>
          {post.status}
        </span>
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
              <DropdownMenuItem onClick={() => setStatus("HIDDEN")}>
                <EyeOff className="mr-2 size-4" />
                Gizle (HIDDEN)
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {post.status !== "REMOVED" && (
              <DropdownMenuItem
                onClick={() => setStatus("REMOVED")}
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
