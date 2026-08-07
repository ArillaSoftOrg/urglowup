import type {
  BusinessClaimRequestType,
  ClaimRequestStatus,
  ClaimVerificationType,
} from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

export const CLAIM_STATUS_LABELS: Record<ClaimRequestStatus, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal Edildi",
};

export const CLAIM_STATUS_VARIANTS: Record<ClaimRequestStatus, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "neutral",
};

export const CLAIM_REQUEST_TYPE_LABELS: Record<
  BusinessClaimRequestType,
  string
> = {
  OWNERSHIP: "Sahiplik",
  REMOVAL: "Kaldırma",
};

export const CLAIM_REQUEST_TYPE_VARIANTS: Record<
  BusinessClaimRequestType,
  BadgeVariant
> = {
  OWNERSHIP: "neutral",
  REMOVAL: "destructive",
};

export const CLAIM_VERIFICATION_LABELS: Record<ClaimVerificationType, string> = {
  PHONE: "Telefon",
  EMAIL: "E-posta",
  DOCUMENT: "Belge",
  GOOGLE_BUSINESS_PROFILE: "Google Business Profile",
  MANUAL_ADMIN: "Manuel (Admin)",
};

/** Verification types offered to the public claim form (excludes MANUAL_ADMIN). */
export type PublicClaimVerificationType =
  | "PHONE"
  | "EMAIL"
  | "DOCUMENT"
  | "GOOGLE_BUSINESS_PROFILE";

export const PUBLIC_CLAIM_VERIFICATION_TYPES: PublicClaimVerificationType[] = [
  "PHONE",
  "EMAIL",
  "DOCUMENT",
  "GOOGLE_BUSINESS_PROFILE",
];
