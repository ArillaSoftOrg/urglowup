"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  rejectClaimRequest,
  approveClaimRequest,
} from "@/app/(admin)/admin/claim-requests/actions";
import {
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_VARIANTS,
  CLAIM_VERIFICATION_LABELS,
} from "@/lib/constants/claim";
import type { AdminClaimRequest } from "@/lib/queries/admin";

interface ClaimRequestTableProps {
  records: AdminClaimRequest[];
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function requesterName(user: AdminClaimRequest["user"]): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function ClaimRequestTable({ records }: ClaimRequestTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: string; reason: string } | null>(null);

  function handleApprove(id: string) {
    setActionId(id);
    startTransition(async () => {
      const res = await approveClaimRequest(id);
      setMessage({ id, text: res.message ?? "", ok: res.success });
      setActionId(null);
      if (res.success) router.refresh();
    });
  }

  function handleReject() {
    if (!rejectDialog) return;
    const { id, reason } = rejectDialog;
    if (!reason.trim()) {
      setMessage({ id, text: "Reddetme nedeni gereklidir.", ok: false });
      return;
    }
    setActionId(id);
    startTransition(async () => {
      const res = await rejectClaimRequest(id, reason.trim());
      setMessage({ id, text: res.message ?? "", ok: res.success });
      setActionId(null);
      if (res.success) setRejectDialog(null);
    });
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
        <Inbox className="w-8 h-8 opacity-40" />
        <p className="text-sm">Henüz başvuru yok.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Başvuran</th>
              <th className="px-3 py-2 text-left font-medium">Yer</th>
              <th className="px-3 py-2 text-left font-medium">Doğrulama</th>
              <th className="px-3 py-2 text-left font-medium">İletişim</th>
              <th className="px-3 py-2 text-left font-medium">Not</th>
              <th className="px-3 py-2 text-left font-medium">Durum</th>
              <th className="px-3 py-2 text-left font-medium">Tarih</th>
              <th className="px-3 py-2 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((rec) => {
              const isLoading = pending && actionId === rec.id;
              const currentMessage = message?.id === rec.id ? message : null;
              const context = [
                rec.business?.name ?? rec.placeReference?.categoryHint,
                rec.placeReference?.district,
                rec.placeReference?.city,
              ]
                .filter(Boolean)
                .join(" · ");
              const businessContext = rec.business
                ? [rec.business.name, rec.business.slug ? `/b/${rec.business.slug}` : null]
                    .filter(Boolean)
                    .join(" · ")
                : null;

              return (
                <tr key={rec.id} className="align-top hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="font-medium">{requesterName(rec.user)}</div>
                    <div className="text-xs text-muted-foreground">{rec.user.email}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {businessContext || context || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {rec.verificationType
                      ? CLAIM_VERIFICATION_LABELS[rec.verificationType]
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{rec.phone ?? "—"}</div>
                    <div className="text-muted-foreground">{rec.email ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[220px] whitespace-pre-line text-muted-foreground">
                    {rec.note ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={CLAIM_STATUS_VARIANTS[rec.status]} className="text-xs">
                      {CLAIM_STATUS_LABELS[rec.status]}
                    </Badge>
                    {currentMessage && (
                      <p className={`mt-1 text-xs ${currentMessage.ok ? "text-green-600" : "text-red-600"}`}>
                        {currentMessage.text}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDate(rec.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {rec.status === "PENDING" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={isLoading}
                          onClick={() => handleApprove(rec.id)}
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Onayla"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={isLoading}
                          onClick={() => setRejectDialog({ id: rec.id, reason: "" })}
                        >
                          Reddet
                        </Button>
                      </div>
                    ) : rec.business ? (
                      <Link
                        href={`/admin/businesses/${rec.business.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {rec.business.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuruyu Reddet</DialogTitle>
          </DialogHeader>
          {rejectDialog && (
            <div className="py-2 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="reject-reason">Reddetme Nedeni</Label>
                <Input
                  id="reject-reason"
                  value={rejectDialog.reason}
                  onChange={(e) =>
                    setRejectDialog((p) => (p ? { ...p, reason: e.target.value } : null))
                  }
                  maxLength={500}
                  autoFocus
                />
              </div>
              {message?.id === rejectDialog.id && !message.ok && (
                <p className="text-sm text-red-600">{message.text}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>
              İptal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || !rejectDialog?.reason.trim()}
              onClick={handleReject}
            >
              {pending && actionId === rejectDialog?.id && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
