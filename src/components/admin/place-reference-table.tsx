"use client";

import { useTransition, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Loader2, MapPin, Unlink, Link2 } from "lucide-react";
import {
  PLACE_REFERENCE_STATUS_LABELS,
  PLACE_REFERENCE_STATUS_VARIANTS,
  getAllowedTransitions,
} from "@/lib/constants/place-reference";
import {
  updatePlaceReferenceStatus,
  updatePlaceReferenceMetadata,
  linkPlaceReferenceToBusiness,
  unlinkPlaceReferenceFromBusiness,
} from "@/app/(admin)/admin/place-references/actions";
import type { AdminPlaceReference } from "@/lib/queries/admin";
import type { PlaceReferenceStatus } from "@/generated/prisma/enums";

interface PlaceReferenceTableProps {
  records: AdminPlaceReference[];
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type EditMetadataState = {
  id: string;
  city: string;
  district: string;
  categoryHint: string;
};

type LinkBusinessState = {
  id: string;
  businessId: string;
};

export function PlaceReferenceTable({ records }: PlaceReferenceTableProps) {
  const [pending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [editDialog, setEditDialog] = useState<EditMetadataState | null>(null);
  const [linkDialog, setLinkDialog] = useState<LinkBusinessState | null>(null);

  function handleStatus(id: string, newStatus: PlaceReferenceStatus) {
    setActionId(id);
    startTransition(async () => {
      const result = await updatePlaceReferenceStatus(id, newStatus);
      setMessage({ id, text: result.message ?? "", ok: result.success });
      setActionId(null);
    });
  }

  function handleUnlink(id: string) {
    setActionId(id);
    startTransition(async () => {
      const result = await unlinkPlaceReferenceFromBusiness(id);
      setMessage({ id, text: result.message ?? "", ok: result.success });
      setActionId(null);
    });
  }

  function handleSaveMetadata() {
    if (!editDialog) return;
    const { id, city, district, categoryHint } = editDialog;
    setActionId(id);
    startTransition(async () => {
      const result = await updatePlaceReferenceMetadata(id, { city, district, categoryHint });
      setMessage({ id, text: result.message ?? "", ok: result.success });
      setActionId(null);
      if (result.success) setEditDialog(null);
    });
  }

  function handleLinkBusiness() {
    if (!linkDialog) return;
    const { id, businessId } = linkDialog;
    if (!businessId.trim()) {
      setMessage({ id, text: "Business ID boş olamaz.", ok: false });
      return;
    }
    setActionId(id);
    startTransition(async () => {
      const result = await linkPlaceReferenceToBusiness(id, businessId.trim());
      setMessage({ id, text: result.message ?? "", ok: result.success });
      setActionId(null);
      if (result.success) setLinkDialog(null);
    });
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
        <MapPin className="w-8 h-8 opacity-40" />
        <p className="text-sm">Henüz yer referansı yok.</p>
        <p className="text-xs">Phase 5 Google Places entegrasyonu sonrasında buraya kayıtlar eklenecek.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Provider / Place ID</th>
              <th className="px-3 py-2 text-left font-medium">Şehir / İlçe</th>
              <th className="px-3 py-2 text-left font-medium">Kategori</th>
              <th className="px-3 py-2 text-left font-medium">Durum</th>
              <th className="px-3 py-2 text-left font-medium">Fetch Durumu</th>
              <th className="px-3 py-2 text-left font-medium">İşletme</th>
              <th className="px-3 py-2 text-left font-medium">Eklenme</th>
              <th className="px-3 py-2 text-left font-medium">Son Fetch</th>
              <th className="px-3 py-2 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((rec) => {
              const isLoading = pending && actionId === rec.id;
              const currentMessage = message?.id === rec.id ? message : null;
              const allowedNext = getAllowedTransitions(rec.status as PlaceReferenceStatus);

              return (
                <tr key={rec.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-muted-foreground">{rec.provider}</div>
                    <div className="font-mono text-xs truncate max-w-[160px]" title={rec.providerPlaceId}>
                      {rec.providerPlaceId}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{rec.city ?? <span className="text-muted-foreground">—</span>}</div>
                    <div className="text-xs text-muted-foreground">{rec.district ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {rec.categoryHint ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={PLACE_REFERENCE_STATUS_VARIANTS[rec.status as PlaceReferenceStatus]}
                      className="text-xs"
                    >
                      {PLACE_REFERENCE_STATUS_LABELS[rec.status as PlaceReferenceStatus]}
                    </Badge>
                    {currentMessage && (
                      <p className={`mt-1 text-xs ${currentMessage.ok ? "text-green-600" : "text-red-600"}`}>
                        {currentMessage.text}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {rec.fetchStatus ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {rec.claimedBusiness ? (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600 font-medium">{rec.claimedBusiness.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={isLoading}
                          onClick={() => handleUnlink(rec.id)}
                          title="İşletme bağlantısını kaldır"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Unlink className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() =>
                          setLinkDialog({ id: rec.id, businessId: "" })
                        }
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Bağla
                      </Button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDate(rec.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDate(rec.lastFetchedAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={isLoading}
                          />
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {allowedNext.length > 0 && (
                          <>
                            {allowedNext.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatus(rec.id, s)}
                              >
                                {PLACE_REFERENCE_STATUS_LABELS[s]} yap
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            setEditDialog({
                              id: rec.id,
                              city: rec.city ?? "",
                              district: rec.district ?? "",
                              categoryHint: rec.categoryHint ?? "",
                            })
                          }
                        >
                          Metadata düzenle
                        </DropdownMenuItem>
                        {rec.providerPlaceId && (
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `https://maps.google.com/?q=${encodeURIComponent(rec.providerPlaceId)}`,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            Google Maps&apos;te aç
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Metadata Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Metadata Düzenle</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="edit-city">Şehir</Label>
                <Input
                  id="edit-city"
                  value={editDialog.city}
                  onChange={(e) =>
                    setEditDialog((p) => p ? { ...p, city: e.target.value } : null)
                  }
                  placeholder="Örn: Antalya"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-district">İlçe</Label>
                <Input
                  id="edit-district"
                  value={editDialog.district}
                  onChange={(e) =>
                    setEditDialog((p) => p ? { ...p, district: e.target.value } : null)
                  }
                  placeholder="Örn: Muratpaşa"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-category">Kategori İpucu</Label>
                <Input
                  id="edit-category"
                  value={editDialog.categoryHint}
                  onChange={(e) =>
                    setEditDialog((p) => p ? { ...p, categoryHint: e.target.value } : null)
                  }
                  placeholder="Örn: beauty_salon"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialog(null)}>
                  İptal
                </Button>
                <Button
                  disabled={pending && actionId === editDialog.id}
                  onClick={handleSaveMetadata}
                >
                  {pending && actionId === editDialog.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Business Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(open) => !open && setLinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşletme Bağla</DialogTitle>
          </DialogHeader>
          {linkDialog && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Bu yer referansını mevcut bir işletmeye bağlamak için Business ID girin.
              </p>
              <div className="space-y-1">
                <Label htmlFor="link-business-id">Business ID</Label>
                <Input
                  id="link-business-id"
                  value={linkDialog.businessId}
                  onChange={(e) =>
                    setLinkDialog((p) => p ? { ...p, businessId: e.target.value } : null)
                  }
                  placeholder="cuid..."
                  className="font-mono text-xs"
                />
              </div>
              {message?.id === linkDialog.id && !message.ok && (
                <p className="text-sm text-red-600">{message.text}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLinkDialog(null)}>
                  İptal
                </Button>
                <Button
                  disabled={pending && actionId === linkDialog.id}
                  onClick={handleLinkBusiness}
                >
                  {pending && actionId === linkDialog.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Bağla
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
