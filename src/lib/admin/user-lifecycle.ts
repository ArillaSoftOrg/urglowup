import type { UserRole } from "@/generated/prisma/enums";
import { isSuspended } from "./user-suspension";

export type LifecycleSegment =
  | "UNVERIFIED"
  | "SUSPENDED"
  | "NEW"
  | "ONBOARDING"
  | "NEVER_BOOKED"
  | "FIRST_BOOKER"
  | "ACTIVE"
  | "RETURNING"
  | "INACTIVE"
  | "CHURNED"
  | "OWNER_ACTIVE"
  | "OWNER_DORMANT";

export const LIFECYCLE_LABELS: Record<LifecycleSegment, string> = {
  UNVERIFIED: "Unverified",
  SUSPENDED: "Suspended",
  NEW: "New",
  ONBOARDING: "Onboarding",
  NEVER_BOOKED: "Never Booked",
  FIRST_BOOKER: "First Booking",
  ACTIVE: "Active",
  RETURNING: "Returning",
  INACTIVE: "Inactive",
  CHURNED: "Churned",
  OWNER_ACTIVE: "Owner – Active",
  OWNER_DORMANT: "Owner – Dormant",
};

export const LIFECYCLE_COLORS: Record<LifecycleSegment, string> = {
  UNVERIFIED: "bg-warning text-warning-foreground",
  SUSPENDED: "bg-destructive/10 text-destructive",
  NEW: "bg-success text-success-foreground",
  ONBOARDING: "bg-info text-info-foreground",
  NEVER_BOOKED: "bg-neutral text-neutral-foreground",
  FIRST_BOOKER: "bg-success text-success-foreground",
  ACTIVE: "bg-success text-success-foreground",
  RETURNING: "bg-info text-info-foreground",
  INACTIVE: "bg-warning text-warning-foreground",
  CHURNED: "bg-destructive/10 text-destructive",
  OWNER_ACTIVE: "bg-info text-info-foreground",
  OWNER_DORMANT: "bg-warning text-warning-foreground",
};

function getDaysAgo(date: Date | null | undefined): number | null {
  if (!date) return null;
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export interface AdminUserLifecycleData {
  id: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  appointmentCount: number;
  completedAppointmentCount: number;
  lastAppointmentDate: Date | null;
  suspendedAt?: Date | null;
  suspendedUntil?: Date | null;
  businessStatus?: string | null;
  businessLastActivityAt?: Date | null;
}

export function computeUserLifecycle(
  user: AdminUserLifecycleData
): LifecycleSegment {
  const daysAgoCreated = getDaysAgo(user.createdAt);
  const daysAgoLogin = getDaysAgo(user.lastLoginAt);
  const daysAgoLastAppointment = getDaysAgo(user.lastAppointmentDate);

  // UNVERIFIED takes absolute priority
  if (!user.emailVerified) {
    return "UNVERIFIED";
  }

  // SUSPENDED is second priority
  if (user.suspendedAt && isSuspended(user)) {
    return "SUSPENDED";
  }

  // Business owner segments
  if (user.role === "BUSINESS_OWNER") {
    if (
      user.businessStatus === "DRAFT" ||
      user.businessStatus === "PENDING_APPROVAL"
    ) {
      return "ONBOARDING";
    }

    // For active businesses (ACTIVE_PRIVATE or ACTIVE_MARKETPLACE)
    if (
      user.businessStatus === "ACTIVE_PRIVATE" ||
      user.businessStatus === "ACTIVE_MARKETPLACE"
    ) {
      const daysLastActive = getDaysAgo(user.businessLastActivityAt);
      if (daysLastActive !== null && daysLastActive > 30) {
        return "OWNER_DORMANT";
      }
      return "OWNER_ACTIVE";
    }

    // Other statuses (SUSPENDED, REJECTED) — treat as dormant for now
    return "OWNER_DORMANT";
  }

  // Customer segments
  if (user.role === "CUSTOMER") {
    // NEW: email verified, created < 7d, 0 appointments
    if (daysAgoCreated !== null && daysAgoCreated < 7 && user.appointmentCount === 0) {
      return "NEW";
    }

    // NEVER_BOOKED: created > 7d ago, 0 appointments
    if (daysAgoCreated !== null && daysAgoCreated >= 7 && user.appointmentCount === 0) {
      return "NEVER_BOOKED";
    }

    // FIRST_BOOKER: exactly 1 completed appointment
    if (user.completedAppointmentCount === 1) {
      return "FIRST_BOOKER";
    }

    // RETURNING: 2+ completed appointments
    if (user.completedAppointmentCount >= 2) {
      // Check if still active
      if (daysAgoLogin !== null && daysAgoLogin <= 30) {
        return "ACTIVE";
      }
      // Check if last appointment was recent
      if (daysAgoLastAppointment !== null && daysAgoLastAppointment <= 30) {
        return "ACTIVE";
      }
      return "RETURNING";
    }

    // ACTIVE: >=1 booking, login < 30d, and last appointment < 30d
    if (
      user.appointmentCount >= 1 &&
      (daysAgoLogin === null || daysAgoLogin <= 30) &&
      (daysAgoLastAppointment === null || daysAgoLastAppointment <= 30)
    ) {
      return "ACTIVE";
    }

    // INACTIVE: login 30-90d OR last appointment 30-90d
    if (
      (daysAgoLogin !== null && daysAgoLogin >= 30 && daysAgoLogin <= 90) ||
      (daysAgoLastAppointment !== null &&
        daysAgoLastAppointment >= 30 &&
        daysAgoLastAppointment <= 90)
    ) {
      return "INACTIVE";
    }

    // CHURNED: login > 90d AND (no appointments OR last appointment > 90d)
    if (
      (daysAgoLogin === null || daysAgoLogin > 90) &&
      (user.appointmentCount === 0 || (daysAgoLastAppointment !== null && daysAgoLastAppointment > 90))
    ) {
      return "CHURNED";
    }

    // Fallback to RETURNING if has completed bookings
    if (user.completedAppointmentCount >= 1) {
      return "RETURNING";
    }

    // Final fallback
    return "NEVER_BOOKED";
  }

  // ADMIN users — no specific lifecycle
  return "NEVER_BOOKED";
}
