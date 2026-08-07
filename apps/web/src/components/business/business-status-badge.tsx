import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { BusinessStatus } from "@/generated/prisma/enums";

const LABELS: Record<BusinessStatus, string> = {
  DRAFT: "Taslak",
  PENDING_APPROVAL: "Onay bekliyor",
  ACTIVE_PRIVATE: "Yayında (özel)",
  ACTIVE_MARKETPLACE: "Yayında",
  SUSPENDED: "Askıya alındı",
  REJECTED: "Reddedildi",
};

const VARIANTS: Record<BusinessStatus, BadgeVariant> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  ACTIVE_PRIVATE: "info",
  ACTIVE_MARKETPLACE: "success",
  SUSPENDED: "destructive",
  REJECTED: "destructive",
};

export function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}

export function getBusinessStatusLabel(status: BusinessStatus): string {
  return LABELS[status];
}
