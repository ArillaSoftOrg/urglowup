"use client";

import Link from "next/link";
import { useTransition, useState, useMemo } from "react";
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
import {
  MoreHorizontal,
  Loader2,
  MapPin,
  Unlink,
  Link2,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  BUSINESS_STATUS_LABELS,
  BUSINESS_STATUS_VARIANTS,
} from "@/lib/constants/business";
import {
  PLACE_REFERENCE_STATUS_HELP,
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
import { ConvertPlaceReferenceDialog } from "@/components/admin/convert-place-reference-dialog";
import { buildGoogleMapsPlaceUrl } from "@/lib/marketplace/map-place";
import type { AdminPlaceReference } from "@/lib/queries/admin";
import type {
  BusinessOwnershipStatus,
  BusinessStatus,
  PlaceReferenceStatus,
} from "@/generated/prisma/enums";

type CategoryOption = { id: string; name: string; slug: string };
type BusinessOption = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  district: string | null;
  status: BusinessStatus;
  ownershipStatus: BusinessOwnershipStatus;
  owner: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

interface PlaceReferenceTableProps {
  records: AdminPlaceReference[];
  categories: CategoryOption[];
  businesses: BusinessOption[];
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
  query: string;
};

function buildMapsLabel(rec: AdminPlaceReference) {
  return [rec.categoryHint, rec.district, rec.city]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");
}

function shortId(id: string) {
  return id.length <= 8 ? id : id.slice(0, 8);
}

function formatLocation(
  item: Pick<BusinessOption | AdminPlaceReference, "city" | "district">,
) {
  return [item.district, item.city].filter(Boolean).join(" / ") || "Konum yok";
}

function formatOwner(owner: BusinessOption["owner"]) {
  if (!owner) return "Sahipsiz";
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ");
  return name ? `${name} (${owner.email})` : owner.email;
}

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function businessSearchText(business: BusinessOption) {
  return normalizeSearch(
    [
      business.id,
      shortId(business.id),
      business.name,
      business.slug,
      business.city,
      business.district,
      business.status,
      BUSINESS_STATUS_LABELS[business.status],
      business.ownershipStatus,
      business.owner?.email,
      business.owner?.firstName,
      business.owner?.lastName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function statusUpdateMessage(status: PlaceReferenceStatus) {
  return `${PLACE_REFERENCE_STATUS_LABELS[status]} olarak işaretlendi.`;
}

export function PlaceReferenceTable({
  records,
  categories,
  businesses,
}: PlaceReferenceTableProps) {
  const [pending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [editDialog, setEditDialog] = useState<EditMetadataState | null>(null);
  const [linkDialog, setLinkDialog] = useState<LinkBusinessState | null>(null);
  const businessSearchIndex = useMemo(
    () =>
      businesses.map((business) => ({
        business,
        searchText: businessSearchText(business),
      })),
    [businesses],
  );
  const currentLinkRecord = linkDialog
    ? records.find((record) => record.id === linkDialog.id) ?? null
    : null;
  const selectedBusiness = linkDialog?.businessId
    ? businesses.find((business) => business.id === linkDialog.businessId) ?? null
    : null;
  const normalizedBusinessQuery = normalizeSearch(linkDialog?.query ?? "");
  const matchingBusinessCount = businessSearchIndex.filter(({ searchText }) =>
    normalizedBusinessQuery ? searchText.includes(normalizedBusinessQuery) : true,
  ).length;
  const filteredBusinesses = businessSearchIndex
    .filter(({ searchText }) =>
      normalizedBusinessQuery ? searchText.includes(normalizedBusinessQuery) : true,
    )
    .slice(0, 20)
    .map(({ business }) => business);

  function handleStatus(id: string, newStatus: PlaceReferenceStatus) {
    setActionId(id);
    startTransition(async () => {
      const result = await updatePlaceReferenceStatus(id, newStatus);
      setMessage({
        id,
        text: result.success ? statusUpdateMessage(newStatus) : result.message ?? "",
        ok: result.success,
      });
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
      setMessage({ id, text: "Bağlamak için bir işletme seçin.", ok: false });
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
              <th className="min-w-[260px] px-3 py-2 text-left font-medium">Referans</th>
              <th className="px-3 py-2 text-left font-medium">Durum</th>
              <th className="min-w-[220px] px-3 py-2 text-left font-medium">Eşleşme Durumu</th>
              <th className="min-w-[190px] px-3 py-2 text-left font-medium">Aksiyon</th>
              <th className="px-3 py-2 text-left font-medium">Tarihçe</th>
              <th className="px-3 py-2 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map((rec) => {
              const isLoading = pending && actionId === rec.id;
              const currentMessage = message?.id === rec.id ? message : null;
              const allowedNext = getAllowedTransitions(rec.status as PlaceReferenceStatus);
              const mapsUrl = buildGoogleMapsPlaceUrl(
                rec.providerPlaceId,
                buildMapsLabel(rec),
              );
              const linkedBusiness = rec.claimedBusiness
                ? businesses.find((business) => business.id === rec.claimedBusiness?.id) ?? null
                : null;
              const status = rec.status as PlaceReferenceStatus;

              return (
                <tr key={rec.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3 align-top">
                    <div className="font-medium">
                      {formatLocation(rec)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{rec.categoryHint ?? "Kategori yok"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.provider}</span>
                    </div>
                    <div
                      className="mt-1 max-w-[260px] truncate font-mono text-[11px] text-muted-foreground"
                      title={rec.providerPlaceId}
                    >
                      {rec.providerPlaceId}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge
                      variant={PLACE_REFERENCE_STATUS_VARIANTS[status]}
                      className="text-xs"
                      title={PLACE_REFERENCE_STATUS_HELP[status]}
                    >
                      {PLACE_REFERENCE_STATUS_LABELS[status]}
                    </Badge>
                    <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                      {PLACE_REFERENCE_STATUS_HELP[status]}
                    </p>
                    {currentMessage && (
                      <p
                        role={currentMessage.ok ? "status" : "alert"}
                        className={`mt-1 text-xs ${
                          currentMessage.ok ? "text-success-foreground" : "text-destructive"
                        }`}
                      >
                        {currentMessage.text}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-xs">
                    {rec.claimedBusiness ? (
                      <div className="flex items-start gap-1.5">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/businesses/${rec.claimedBusiness.id}`}
                            className="block truncate font-medium text-blue-600 hover:underline"
                          >
                            {rec.claimedBusiness.name}
                          </Link>
                          <div className="text-[11px] text-muted-foreground">
                            {linkedBusiness ? formatLocation(linkedBusiness) : formatLocation(rec)}
                          </div>
                          <Badge
                            variant={
                              linkedBusiness
                                ? BUSINESS_STATUS_VARIANTS[linkedBusiness.status]
                                : "secondary"
                            }
                            className="mt-1 text-[10px]"
                          >
                            {linkedBusiness
                              ? BUSINESS_STATUS_LABELS[linkedBusiness.status]
                            : "Bağlı"}
                          </Badge>
                        </div>
                      </div>
                    ) : status === "DUPLICATE" ? (
                      <div className="max-w-[220px] text-muted-foreground">
                        Mükerrer işaretli. Aynı işletme varsa mevcut kayda bağlayın veya menüden yeniden onaylayın.
                      </div>
                    ) : (
                      <div className="max-w-[220px] text-muted-foreground">
                        Henüz Business kaydına bağlı değil.
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-xs">
                    {rec.claimedBusiness ? (
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          render={<Link href={`/admin/businesses/${rec.claimedBusiness.id}`} />}
                        >
                          <ExternalLink className="mr-1 size-3" />
                          İşletmeyi aç
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          disabled={isLoading}
                          onClick={() => handleUnlink(rec.id)}
                          title="İşletme bağlantısını kaldır"
                        >
                          {isLoading ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : (
                            <Unlink className="mr-1 size-3" />
                          )}
                          Bağlantıyı kaldır
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1.5">
                        {rec.provider === "GOOGLE" && !!rec.providerPlaceId && (
                          <ConvertPlaceReferenceDialog record={rec} categories={categories} />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() =>
                            setLinkDialog({ id: rec.id, businessId: "", query: "" })
                          }
                        >
                          <Link2 className="mr-1 size-3" />
                          Mevcut işletmeye bağla
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-muted-foreground">
                    <div>Eklenme: {formatDate(rec.createdAt)}</div>
                    <div>Son fetch: {formatDate(rec.lastFetchedAt)}</div>
                    <div>Fetch: {rec.fetchStatus ?? "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-right align-top">
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
                                {PLACE_REFERENCE_STATUS_LABELS[s]} olarak işaretle
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
                        {mapsUrl && (
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                mapsUrl,
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mevcut İşletmeye Bağla</DialogTitle>
          </DialogHeader>
          {linkDialog && currentLinkRecord && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Bu Google referansını yeni işletme oluşturmak yerine mevcut bir işletme kaydına bağlamak için kullanın.
              </p>
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <div className="mb-2 font-medium text-foreground">Yer referansı</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Konum: </span>
                    {formatLocation(currentLinkRecord)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kategori: </span>
                    {currentLinkRecord.categoryHint ?? "—"}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Place ID: </span>
                    <span className="font-mono">{currentLinkRecord.providerPlaceId}</span>
                  </div>
                </div>
                {buildGoogleMapsPlaceUrl(
                  currentLinkRecord.providerPlaceId,
                  buildMapsLabel(currentLinkRecord),
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8"
                    onClick={() => {
                      const url = buildGoogleMapsPlaceUrl(
                        currentLinkRecord.providerPlaceId,
                        buildMapsLabel(currentLinkRecord),
                      );
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="mr-1 size-3" />
                    Google Maps&apos;te aç
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-search">İşletme ara</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="business-search"
                    value={linkDialog.query}
                    onChange={(e) =>
                      setLinkDialog((p) =>
                        p ? { ...p, query: e.target.value, businessId: "" } : null,
                      )
                    }
                    placeholder="İşletme adı, şehir, sahip e-postası veya kısa ID"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {matchingBusinessCount > 20
                    ? `${matchingBusinessCount} eşleşme var; ilk 20 gösteriliyor. Aramayı daraltın.`
                    : `${matchingBusinessCount} eşleşme`}
                </p>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredBusinesses.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Eşleşen işletme bulunamadı.
                  </div>
                ) : (
                  filteredBusinesses.map((business) => {
                    const isSelected = business.id === linkDialog.businessId;
                    return (
                      <button
                        key={business.id}
                        type="button"
                        className={`w-full rounded-md border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() =>
                          setLinkDialog((p) =>
                            p ? { ...p, businessId: business.id } : null,
                          )
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{business.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatLocation(business)} · {formatOwner(business.owner)}
                            </div>
                            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                              ID: {shortId(business.id)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={BUSINESS_STATUS_VARIANTS[business.status]}
                              className="text-[10px]"
                            >
                              {BUSINESS_STATUS_LABELS[business.status]}
                            </Badge>
                            {business.ownershipStatus === "UNCLAIMED" && (
                              <Badge variant="secondary" className="text-[10px]">
                                Sahipsiz
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedBusiness && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <div className="font-medium">Seçilen işletme: {selectedBusiness.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatLocation(selectedBusiness)} · {formatOwner(selectedBusiness.owner)} · ID:{" "}
                    <span className="font-mono">{shortId(selectedBusiness.id)}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Teknik ID seçimden otomatik doldurulur; manuel ID girişi gerekmez.
              </div>
              {message?.id === linkDialog.id && !message.ok && (
                <p role="alert" className="text-sm text-destructive">{message.text}</p>
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
