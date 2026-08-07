import type { PlaceReferenceStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

export const PLACE_REFERENCE_STATUS_LABELS: Record<PlaceReferenceStatus, string> = {
  DISCOVERED: "Keşfedildi",
  APPROVED: "Haritada Yayında",
  HIDDEN: "Gizli",
  DUPLICATE: "Mükerrer",
  CLAIM_PENDING: "Sahiplenme Bekliyor",
  CLAIMED: "İşletmeye Bağlandı",
  REJECTED: "Reddedildi",
  STALE: "Eskimiş",
  ERROR: "Hata",
};

export const PLACE_REFERENCE_STATUS_HELP: Record<PlaceReferenceStatus, string> = {
  DISCOVERED: "Google'dan bulundu, admin kararı bekliyor.",
  APPROVED: "Geçerli dış referans. İşletmeye bağlı değilse haritada Google kaynağı olarak görünür.",
  HIDDEN: "Haritadan ve keşif akışından gizlenir.",
  DUPLICATE: "Sistemde aynı işletme veya Google Place zaten var.",
  CLAIM_PENDING: "Sahiplenme veya işletmeye dönüştürme süreci devam ediyor.",
  CLAIMED: "Referans bir Business kaydına bağlandı, dış marker olarak görünmez.",
  REJECTED: "Admin tarafından reddedildi.",
  STALE: "Google kaydı eskimiş veya yeniden kontrol gerektiriyor.",
  ERROR: "Son fetch veya doğrulama işleminde hata oluştu.",
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
