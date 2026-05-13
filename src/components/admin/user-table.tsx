"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { changeUserRole } from "@/app/(admin)/admin/actions";
import type { AdminUser } from "@/lib/queries/admin";
import type { UserRole } from "@/generated/prisma/enums";

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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UserRow({ user }: { user: AdminUser }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  function handleChangeRole() {
    if (selectedRole === user.role) return;
    setError(null);
    startTransition(async () => {
      const result = await changeUserRole(user.id, selectedRole as UserRole);
      if (!result.success) {
        setError(result.message ?? "Failed to change role.");
      } else {
        setDialogOpen(false);
      }
    });
  }

  return (
    <div className="flex items-center justify-between border-b p-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name || user.email}</span>
          <Badge className={`text-xs ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {user.email} &middot; {formatDate(user.createdAt)}
          {user.business && (
            <>
              {" "}
              &middot;{" "}
              <Link
                href={`/admin/businesses/${user.business.id}`}
                className="text-primary hover:underline"
              >
                {user.business.name}
              </Link>
            </>
          )}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        Change Role
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change role for {name || user.email}. Current role:{" "}
              {ROLE_LABELS[user.role]}.
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
    </div>
  );
}

export function UserTable({ users }: { users: AdminUser[] }) {
  const customers = users.filter((u) => u.role === "CUSTOMER");
  const owners = users.filter((u) => u.role === "BUSINESS_OWNER");
  const admins = users.filter((u) => u.role === "ADMIN");

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All ({users.length})</TabsTrigger>
        <TabsTrigger value="customers">
          Customers ({customers.length})
        </TabsTrigger>
        <TabsTrigger value="owners">Owners ({owners.length})</TabsTrigger>
        <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
      </TabsList>

      {[
        { value: "all", items: users },
        { value: "customers", items: customers },
        { value: "owners", items: owners },
        { value: "admins", items: admins },
      ].map(({ value, items }) => (
        <TabsContent key={value} value={value} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No users found
                  </p>
                </div>
              ) : (
                items.map((u) => <UserRow key={u.id} user={u} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
