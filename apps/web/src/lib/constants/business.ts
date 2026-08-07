import type { BusinessStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ACTIVE_PRIVATE: "Active (Private)",
  ACTIVE_MARKETPLACE: "Active (Marketplace)",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
};

export const BUSINESS_STATUS_COLORS: Record<BusinessStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  ACTIVE_PRIVATE: "bg-blue-100 text-blue-800",
  ACTIVE_MARKETPLACE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

export const BUSINESS_STATUS_VARIANTS: Record<BusinessStatus, BadgeVariant> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  ACTIVE_PRIVATE: "info",
  ACTIVE_MARKETPLACE: "success",
  SUSPENDED: "destructive",
  REJECTED: "destructive",
};

/** Valid status transitions that an admin can perform */
export const ADMIN_STATUS_TRANSITIONS: Record<BusinessStatus, BusinessStatus[]> =
  {
    DRAFT: [],
    PENDING_APPROVAL: ["ACTIVE_PRIVATE", "ACTIVE_MARKETPLACE", "REJECTED"],
    ACTIVE_PRIVATE: ["ACTIVE_MARKETPLACE", "SUSPENDED"],
    ACTIVE_MARKETPLACE: ["ACTIVE_PRIVATE", "SUSPENDED"],
    SUSPENDED: ["ACTIVE_PRIVATE", "ACTIVE_MARKETPLACE"],
    REJECTED: ["ACTIVE_PRIVATE"],
  };

/** Marketplace visibility value to auto-set for each status */
export const MARKETPLACE_VISIBILITY_FOR_STATUS: Record<
  BusinessStatus,
  boolean
> = {
  DRAFT: false,
  PENDING_APPROVAL: false,
  ACTIVE_PRIVATE: false,
  ACTIVE_MARKETPLACE: true,
  SUSPENDED: false,
  REJECTED: false,
};
