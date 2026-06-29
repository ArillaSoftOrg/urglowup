import type { PlaceReferenceStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

export const PLACE_REFERENCE_STATUS_LABELS: Record<PlaceReferenceStatus, string> = {
  DISCOVERED: "Keşfedildi",
  APPROVED: "Onaylandı",
  HIDDEN: "Gizli",
  DUPLICATE: "Yinelenen",
  CLAIM_PENDING: "Talep Bekliyor",
  CLAIMED: "Talep Edildi",
  REJECTED: "Reddedildi",
  STALE: "Eskimiş",
  ERROR: "Hata",
};

export const PLACE_REFERENCE_STATUS_VARIANTS: Record<PlaceReferenceStatus, BadgeVariant> = {
  DISCOVERED: "neutral",
  APPROVED: "success",
  HIDDEN: "neutral",
  DUPLICATE: "warning",
  CLAIM_PENDING: "warning",
  CLAIMED: "info",
  REJECTED: "destructive",
  STALE: "neutral",
  ERROR: "destructive",
};

export const ADMIN_PLACE_REFERENCE_TRANSITIONS: Record<
  PlaceReferenceStatus,
  PlaceReferenceStatus[]
> = {
  DISCOVERED: ["APPROVED", "HIDDEN", "DUPLICATE", "REJECTED"],
  APPROVED:   ["HIDDEN", "DUPLICATE", "REJECTED"],
  HIDDEN:     ["APPROVED", "REJECTED"],
  DUPLICATE:  ["APPROVED", "REJECTED"],
  CLAIM_PENDING: ["APPROVED", "HIDDEN", "REJECTED"],
  CLAIMED:    ["APPROVED"],
  REJECTED:   ["APPROVED"],
  STALE:      ["APPROVED", "HIDDEN", "REJECTED"],
  ERROR:      ["APPROVED", "HIDDEN", "REJECTED"],
};

export function getAllowedTransitions(
  current: PlaceReferenceStatus
): PlaceReferenceStatus[] {
  return ADMIN_PLACE_REFERENCE_TRANSITIONS[current] ?? [];
}
