"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReasonGate } from "./reason-gate";
import { getTierColor, getTierLabel } from "@/lib/admin/content-signals";
import {
  adminHideReview,
  adminRemoveReview,
  hideMedia,
  removeMedia,
  adminSetPostStatus,
  adminAddContentNote,
  adminSuspendUser,
} from "@/app/(admin)/admin/actions";
import Link from "next/link";
import type { ModerationQueueItem } from "@/lib/admin/moderation-queue";

interface ModerationQueueRowProps {
  item: ModerationQueueItem;
}

export function ModerationQueueRow({ item }: ModerationQueueRowProps) {
  const [isPending, startTransition] = useTransition();
  const [actionInProgress, setActionInProgress] = useState<"hide" | "remove" | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [note, setNote] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspensionDays, setSuspensionDays] = useState<string>("7");
  const [suspensionReason, setSuspensionReason] = useState("");

  async function handleHide(reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        if (item.entityType === "Review") {
          await adminHideReview(item.id, reason);
        } else if (item.entityType === "BusinessMedia") {
          await hideMedia(item.id, reason);
        } else if (item.entityType === "Post") {
          await adminSetPostStatus(item.id, "HIDDEN", reason);
        }
        setActionInProgress(null);
        resolve();
      });
    });
  }

  async function handleRemove(reason: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        if (item.entityType === "Review") {
          await adminRemoveReview(item.id, reason);
        } else if (item.entityType === "BusinessMedia") {
          await removeMedia(item.id, reason);
        } else if (item.entityType === "Post") {
          await adminSetPostStatus(item.id, "REMOVED", reason);
        }
        setActionInProgress(null);
        resolve();
      });
    });
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    startTransition(async () => {
      await adminAddContentNote(item.entityType, item.id, note);
      setShowNoteForm(false);
      setNote("");
    });
  }

  async function handleSuspendAuthor() {
    if (!item.authorId || !suspensionReason.trim()) return;
    startTransition(async () => {
      const days = suspensionDays === "indefinite" ? undefined : parseInt(suspensionDays, 10);
      await adminSuspendUser(item.authorId!, suspensionReason, days);
      setShowSuspendDialog(false);
      setSuspensionDays("7");
      setSuspensionReason("");
    });
  }

  const tierColor = getTierColor(item.priorityTier);
  const showSuspendButton = item.priorViolations >= 3 && item.authorId;

  if (actionInProgress) {
    return (
      <div className={`rounded-lg border-l-4 border p-4 ${tierColor}`}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-900">{item.businessName}</p>
            <p className="text-xs text-slate-600">{item.snippet}</p>
          </div>
          <button
            onClick={() => setActionInProgress(null)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
        <ReasonGate
          onConfirm={actionInProgress === "hide" ? handleHide : handleRemove}
          onCancel={() => setActionInProgress(null)}
          actionLabel={actionInProgress === "hide" ? "Hide" : "Remove"}
          isPending={isPending}
        />
      </div>
    );
  }

  if (showNoteForm) {
    return (
      <div className={`rounded-lg border-l-4 border p-4 ${tierColor}`}>
        <div className="mb-3 flex items-start justify-between">
          <p className="font-medium text-slate-900">Add Note</p>
          <button
            onClick={() => setShowNoteForm(false)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an internal note..."
            maxLength={2000}
            disabled={isPending}
            className="w-full rounded border border-slate-300 p-2 text-sm placeholder-slate-500 disabled:bg-slate-100"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNote}
              disabled={isPending || !note.trim()}
              className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400"
            >
              {isPending ? "Saving..." : "Save Note"}
            </button>
            <button
              onClick={() => setShowNoteForm(false)}
              disabled={isPending}
              className="flex-1 rounded bg-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-400 disabled:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-l-4 border p-4 ${tierColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              href={`/admin/businesses/${item.businessId}`}
              className="font-medium hover:underline"
            >
              {item.businessName}
            </Link>
            <Badge variant="outline" className="text-xs">
              {item.entityType}
            </Badge>
            <Badge className="text-xs bg-slate-100 text-slate-800">
              {getTierLabel(item.priorityTier)}
            </Badge>
          </div>
          <p className="text-sm text-slate-700 mb-2 line-clamp-2">
            {item.snippet}
          </p>
          <p className="text-xs text-slate-500">
            {item.authorName && `${item.authorName} · `}
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={() => setActionInProgress("hide")}
            disabled={isPending}
            className="rounded bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:bg-slate-200 disabled:text-slate-500"
          >
            Hide
          </button>
          <button
            onClick={() => setActionInProgress("remove")}
            disabled={isPending}
            className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200 disabled:bg-slate-200 disabled:text-slate-500"
          >
            Remove
          </button>
          <button
            onClick={() => setShowNoteForm(true)}
            disabled={isPending}
            className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
          >
            Note
          </button>
          {showSuspendButton && (
            <button
              onClick={() => setShowSuspendDialog(true)}
              disabled={isPending}
              className="rounded bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-200 disabled:bg-slate-200 disabled:text-slate-500"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Author</DialogTitle>
            <DialogDescription>
              Suspend {item.authorName || "this user"} ({item.priorViolations} prior violations)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Duration</label>
              <Select value={suspensionDays} onValueChange={(val) => val && setSuspensionDays(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Reason</label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Why is this user being suspended?"
                maxLength={500}
                disabled={isPending}
                className="w-full rounded border border-slate-300 p-2 text-sm placeholder-slate-500 disabled:bg-slate-100"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspendAuthor}
              disabled={isPending || !suspensionReason.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isPending ? "Suspending..." : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
