"use client";

import { useState, useTransition } from "react";
import type { AdminUserDetail } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Mail, Calendar, Heart, CheckCircle2, UserCog, AlertCircle, Loader2 } from "lucide-react";
import {
  LIFECYCLE_COLORS,
  LIFECYCLE_LABELS,
  type LifecycleSegment,
  computeUserLifecycle,
} from "@/lib/admin/user-lifecycle";
import { UserConsentDetail } from "./user-consent-detail";
import { SuspensionStatusBadge } from "./suspension-status-badge";
import { adminSuspendUser, adminUnsuspendUser } from "@/app/(admin)/admin/actions";
import { getSuspensionStatus } from "@/lib/admin/user-suspension";

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: "bg-gray-100 text-gray-800",
  BUSINESS_OWNER: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
};

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  BUSINESS_OWNER: "Business Owner",
  ADMIN: "Admin",
};

const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-900",
  CONFIRMED: "bg-blue-100 text-blue-900",
  REJECTED: "bg-red-100 text-red-900",
  CANCELLED_BY_CUSTOMER: "bg-gray-100 text-gray-900",
  CANCELLED_BY_BUSINESS: "bg-gray-100 text-gray-900",
  COMPLETED: "bg-green-100 text-green-900",
  NO_SHOW: "bg-orange-100 text-orange-900",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDaysAgo(date: Date | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}m ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function computeProfileCompletion(
  user: any
): { score: number; missing: string[] } {
  const missing: string[] = [];
  if (!user.emailVerified) missing.push("Email");
  if (!user.firstName) missing.push("First Name");
  if (!user.lastName) missing.push("Last Name");
  if (!user.phone) missing.push("Phone");
  if (!user.serviceAddress) missing.push("Address");
  if (!user.avatarUrl) missing.push("Avatar");

  const score = Math.round(((6 - missing.length) / 6) * 100);
  return { score, missing };
}

interface UserDetailViewProps {
  data: AdminUserDetail;
}

export function UserDetailView({ data }: UserDetailViewProps) {
  if (!data) return null;

  const detailData = data as any;
  if (!detailData.user) return null;

  const user = detailData.user;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const profileCompletion = computeProfileCompletion(user);
  const appointmentData =
    data.appointments.length > 0
      ? {
          total: data.appointments.length,
          completed: data.appointments.filter(
            (a) => a.status === "COMPLETED"
          ).length,
        }
      : null;

  // Compute lifecycle
  const lifecycle = computeUserLifecycle({
    id: user.id,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    lastLoginAt: user.sessions?.[0]?.updatedAt ?? null,
    appointmentCount: data.appointments.length,
    completedAppointmentCount: data.appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length,
    lastAppointmentDate:
      data.appointments.length > 0 ? data.appointments[0].requestedDate : null,
    businessStatus: user.business?.status ?? null,
  });

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{user.email}</p>
                {user.emailVerified ? (
                  <CheckCircle2 className="size-4 text-green-600" />
                ) : (
                  <Badge variant="outline" className="bg-yellow-50">
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge className={`${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{user.serviceAddress || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Active</p>
              <p className="font-medium">
                {user.sessions && user.sessions.length > 0
                  ? formatDaysAgo(user.sessions[0]?.updatedAt)
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge
              className={`text-sm px-3 py-1 ${
                LIFECYCLE_COLORS[lifecycle]
              }`}
            >
              {LIFECYCLE_LABELS[lifecycle]}
            </Badge>
            <div>
              <p className="text-sm font-medium">Member for</p>
              <p className="text-xs text-muted-foreground">
                {Math.floor(
                  (new Date().getTime() - user.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded">
              <p className="text-2xl font-bold">
                {appointmentData?.total ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <p className="text-2xl font-bold">
                {appointmentData?.completed ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <p className="text-2xl font-bold">
                {data.engagement.saves}
              </p>
              <p className="text-xs text-muted-foreground">Saved Posts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspension Card */}
      <SuspensionPanel userId={user.id} suspendedAt={user.suspendedAt} suspendedUntil={user.suspendedUntil} suspensionReason={user.suspensionReason} />

      {/* Business Card (if owner) */}
      {user.role === "BUSINESS_OWNER" && user.business != null && (
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{user.business.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.business.slug}
                  </p>
                </div>
                <Badge variant="outline">{user.business.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(user.business.createdAt)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => (window.location.href = `/admin/businesses/${user.business!.id}`)}
              >
                View Business Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consent & Marketing Card */}
      <UserConsentDetail
        preferences={user.preferences}
        consentLogs={data.consentLogs}
      />

      {/* Affinity Card */}
      {user.preferences?.personalizationConsentAt && (
        <Card>
          <CardHeader>
            <CardTitle>Personalization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.preferences.affinityComputedAt ? (
              <div className="space-y-4">
                {user.preferences.preferredCategoryIds &&
                  Array.isArray(user.preferences.preferredCategoryIds) &&
                  user.preferences.preferredCategoryIds.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Top Categories
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          user.preferences.preferredCategoryIds as string[]
                        ).map((catId) => (
                          <Badge key={catId} variant="secondary">
                            {catId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                <p className="text-xs text-muted-foreground">
                  Last updated {formatDaysAgo(user.preferences.affinityComputedAt)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Affinity not yet computed
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment History</CardTitle>
        </CardHeader>
        <CardContent>
          {data.appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No appointments yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex justify-between items-start p-3 bg-muted rounded"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {apt.business.name} - {apt.service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(apt.requestedDate)}
                    </p>
                  </div>
                  <Badge className={`${APPOINTMENT_STATUS_COLORS[apt.status]}`}>
                    {apt.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded">
              <p className="text-2xl font-bold">{data.engagement.favorites}</p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="text-2xl font-bold">{data.engagement.saves}</p>
              <p className="text-xs text-muted-foreground">Saved Posts</p>
            </div>
          </div>
          {data.engagement.saveDetails.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Recent Saves</p>
              <div className="space-y-2">
                {data.engagement.saveDetails.map((save) => (
                  <Link
                    key={save.id}
                    href={`/admin/posts/${save.post.id}`}
                    className="text-xs text-primary hover:underline block"
                  >
                    {save.post.business.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Action History</CardTitle>
        </CardHeader>
        <CardContent>
          {data.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin actions recorded
            </p>
          ) : (
            <div className="space-y-3">
              {data.actions.map((action) => (
                <div
                  key={action.id}
                  className="flex justify-between items-start p-3 bg-muted rounded text-sm"
                >
                  <div>
                    <p className="font-medium">{action.action}</p>
                    <p className="text-xs text-muted-foreground">
                      by {action.admin.firstName} {action.admin.lastName} (
                      {action.admin.email})
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(action.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SuspensionPanel({
  userId,
  suspendedAt,
  suspendedUntil,
  suspensionReason,
}: {
  userId: string;
  suspendedAt: Date | null;
  suspendedUntil: Date | null;
  suspensionReason: string | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("7");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const status = getSuspensionStatus({ suspendedAt, suspendedUntil, suspensionReason } as any);

  const handleSuspend = () => {
    setError(null);
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }
    startTransition(async () => {
      const result = await adminSuspendUser(userId, reason, duration === "indefinite" ? undefined : parseInt(duration));
      if (!result.success) {
        setError(result.message ?? "Failed to suspend user");
      } else {
        setDialogOpen(false);
        setReason("");
        setDuration("7");
        window.location.reload();
      }
    });
  };

  const handleUnsuspend = () => {
    setError(null);
    startTransition(async () => {
      const result = await adminUnsuspendUser(userId);
      if (!result.success) {
        setError(result.message ?? "Failed to unsuspend user");
      } else {
        window.location.reload();
      }
    });
  };

  if (status.isSuspended) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Suspension</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SuspensionStatusBadge
            suspendedAt={suspendedAt}
            suspendedUntil={suspendedUntil}
            suspensionReason={suspensionReason}
            size="md"
          />
          {suspensionReason && (
            <div>
              <p className="text-sm font-medium">Reason</p>
              <p className="text-sm text-muted-foreground">{suspensionReason}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnsuspend}
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Unsuspend User
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suspension</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">User is currently not suspended</p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          Suspend User
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
              <DialogDescription>
                Temporarily suspend this user account. They will not be able to book, post, or interact with the platform.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason (required)</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  placeholder="Why is this user being suspended?"
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{reason.length}/500</p>
              </div>

              <div>
                <label className="text-sm font-medium">Duration</label>
                <Select value={duration} onValueChange={(value: any) => setDuration(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={isPending}
              >
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Suspend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
