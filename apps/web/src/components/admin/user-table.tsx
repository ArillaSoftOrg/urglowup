"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Loader2,
  Search,
  ChevronDown,
  Eye,
  Calendar,
  Mail,
} from "lucide-react";
import { changeUserRole, adminSuspendUser, adminUnsuspendUser, resendVerificationEmail } from "@/app/(admin)/admin/actions";
import type { AdminUser } from "@/lib/queries/admin";
import type { UserRole } from "@/generated/prisma/enums";
import type { LifecycleSegment } from "@/lib/admin/user-lifecycle";
import { LIFECYCLE_COLORS, LIFECYCLE_LABELS } from "@/lib/admin/user-lifecycle";
import { SuspensionStatusBadge } from "./suspension-status-badge";
import { Textarea } from "@/components/ui/textarea";

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: "bg-gray-100 text-gray-800",
  BUSINESS_OWNER: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
};

const ROLE_LABELS_MAP: Record<string, string> = {
  CUSTOMER: "Customer",
  BUSINESS_OWNER: "Business Owner",
  ADMIN: "Admin",
};

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

interface UserRowProps {
  user: AdminUser;
}

function UserRow({ user }: UserRowProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const emailUnverified = !user.emailVerified;
  const marketingOptIn = user.preferences?.emailMarketing ?? false;

  function handleChangeRole() {
    if (selectedRole === user.role) return;
    setError(null);
    startTransition(async () => {
      const result = await changeUserRole(user.id, selectedRole as UserRole);
      if (!result.success) {
        setError(result.message ?? "Failed to change role.");
      } else {
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function handleSuspendUser() {
    setSuspendError(null);
    if (!suspendReason.trim()) {
      setSuspendError("Reason is required");
      return;
    }
    startTransition(async () => {
      const result = await adminSuspendUser(
        user.id,
        suspendReason,
        suspendDuration === "indefinite" ? undefined : parseInt(suspendDuration)
      );
      if (!result.success) {
        setSuspendError(result.message ?? "Failed to suspend user");
      } else {
        setSuspendDialogOpen(false);
        setSuspendReason("");
        setSuspendDuration("7");
        router.refresh();
      }
    });
  }

  function handleUnsuspendUser() {
    setSuspendError(null);
    startTransition(async () => {
      const result = await adminUnsuspendUser(user.id);
      if (!result.success) {
        setSuspendError(result.message ?? "Failed to unsuspend user");
      } else {
        router.refresh();
      }
    });
  }

  function handleResendVerification() {
    startTransition(async () => {
      const result = await resendVerificationEmail(user.id);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-between border-b p-3 last:border-0 hover:bg-gray-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{name || user.email}</span>
          <Badge className={`text-xs ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS_MAP[user.role]}
          </Badge>
          {emailUnverified && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              Unverified
            </Badge>
          )}
          <Badge
            className={`text-xs ${
              LIFECYCLE_COLORS[
                user.lifecycle as keyof typeof LIFECYCLE_COLORS
              ]
            }`}
          >
            {LIFECYCLE_LABELS[user.lifecycle as LifecycleSegment]}
          </Badge>
          <SuspensionStatusBadge
            suspendedAt={user.suspendedAt}
            suspendedUntil={user.suspendedUntil}
            suspensionReason={user.suspensionReason}
            size="sm"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {user.email}
          {user.lastLoginAt && (
            <>
              {" "}
              &middot; Last login: {formatDaysAgo(user.lastLoginAt)}
            </>
          )}
          {user.appointmentCount > 0 && (
            <>
              {" "}
              &middot; {user.appointmentCount} booking{user.appointmentCount !== 1 ? "s" : ""}
            </>
          )}
          {marketingOptIn && (
            <>
              {" "}
              &middot; <span className="text-green-600">📧 Marketing</span>
            </>
          )}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="sm">
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}`}>
            <Eye className="size-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = `/admin/appointments?customerId=${user.id}`}>
            <Calendar className="size-4 mr-2" />
            View Appointments
          </DropdownMenuItem>
          {emailUnverified && (
            <DropdownMenuItem onClick={handleResendVerification}>
              <Mail className="size-4 mr-2" />
              Resend Verification Email
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            Change Role
          </DropdownMenuItem>
          {!user.suspendedAt && (
            <DropdownMenuItem onClick={() => setSuspendDialogOpen(true)}>
              Suspend User
            </DropdownMenuItem>
          )}
          {user.suspendedAt && (
            <DropdownMenuItem onClick={handleUnsuspendUser}>
              Lift Suspension
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change role for {name || user.email}. Current role:{" "}
              {ROLE_LABELS_MAP[user.role]}.
            </DialogDescription>
          </DialogHeader>

          <Select
            value={selectedRole}
            onValueChange={(v) => setSelectedRole(v as UserRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={isPending || selectedRole === user.role}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Temporarily suspend {name || user.email}. They will not be able to book, post, or interact with the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value.slice(0, 500))}
                placeholder="Why is this user being suspended?"
                className="mt-1"
                rows={3}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">{suspendReason.length}/500</p>
            </div>

            <div>
              <label className="text-sm font-medium">Duration</label>
              <Select value={suspendDuration} onValueChange={(value) => value && setSuspendDuration(value)} disabled={isPending}>
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

            {suspendError && <p className="text-sm text-destructive">{suspendError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspendUser}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export interface UserTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

type SortField = "name" | "createdAt" | "lastLogin" | "bookings" | "role";
type SortOrder = "asc" | "desc";

export function UserTable({
  users,
  total,
  page,
  pageSize,
  pageCount,
}: UserTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? ""
  );
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [lifecycle, setLifecycle] = useState<LifecycleSegment | "all">(
    (searchParams.get("lifecycle") as LifecycleSegment) ?? "all"
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleLifecycleFilter = (seg: LifecycleSegment | "all") => {
    setLifecycle(seg);
    const params = new URLSearchParams(searchParams);
    if (seg !== "all") {
      params.set("lifecycle", seg);
    } else {
      params.delete("lifecycle");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  };

  const lifecycleGroups = useMemo(() => {
    const groups: Record<string, AdminUser[]> = {};
    const allLifecycles = [
      "UNVERIFIED",
      "SUSPENDED",
      "NEW",
      "ONBOARDING",
      "NEVER_BOOKED",
      "FIRST_BOOKER",
      "ACTIVE",
      "RETURNING",
      "INACTIVE",
      "CHURNED",
      "OWNER_ACTIVE",
      "OWNER_DORMANT",
    ];

    for (const lc of allLifecycles) {
      groups[lc] = users.filter((u) => u.lifecycle === lc);
    }

    return groups;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const result = [...users];

    if (sortField === "name") {
      result.sort((a, b) => {
        const aName = [a.firstName, a.lastName].filter(Boolean).join(" ");
        const bName = [b.firstName, b.lastName].filter(Boolean).join(" ");
        return sortOrder === "asc"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      });
    } else if (sortField === "createdAt") {
      result.sort((a, b) => {
        const cmp = b.createdAt.getTime() - a.createdAt.getTime();
        return sortOrder === "asc" ? -cmp : cmp;
      });
    } else if (sortField === "lastLogin") {
      result.sort((a, b) => {
        const aTime = a.lastLoginAt?.getTime() ?? 0;
        const bTime = b.lastLoginAt?.getTime() ?? 0;
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      });
    } else if (sortField === "bookings") {
      result.sort((a, b) => {
        const cmp = b.appointmentCount - a.appointmentCount;
        return sortOrder === "asc" ? -cmp : cmp;
      });
    }

    return result;
  }, [users, sortField, sortOrder]);

  const lifecycles = Object.keys(lifecycleGroups) as LifecycleSegment[];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortField} onValueChange={(v) => handleSort(v as SortField)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="lastLogin">Last Login</SelectItem>
            <SelectItem value="bookings">Bookings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={lifecycle}
        onValueChange={(v) => handleLifecycleFilter(v as LifecycleSegment | "all")}
      >
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({total})</TabsTrigger>
          {lifecycles.map((lc) => (
            <TabsTrigger key={lc} value={lc}>
              {LIFECYCLE_LABELS[lc]} ({lifecycleGroups[lc].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={lifecycle} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No users found
                  </p>
                </div>
              ) : (
                <>
                  {filteredUsers.map((u) => (
                    <UserRow key={u.id} user={u} />
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                {[...Array(pageCount)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pageCount}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
