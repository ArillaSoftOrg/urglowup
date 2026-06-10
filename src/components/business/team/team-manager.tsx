"use client";

import { useActionState, useState, useTransition } from "react";
import {
  inviteMember,
  cancelInvitation,
  updateMemberRole,
  removeMember,
  type TeamActionState,
} from "@/app/(business)/business/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Trash2, UserPlus, X } from "lucide-react";
import { BusinessMemberRole } from "@/generated/prisma/enums";

const ROLE_LABELS: Record<BusinessMemberRole, string> = {
  OWNER: "Sahip",
  MANAGER: "Yönetici",
  STAFF: "Personel",
};

const ROLE_BADGE_VARIANTS: Record<BusinessMemberRole, BadgeVariant> = {
  OWNER: "pink",
  MANAGER: "info",
  STAFF: "neutral",
};

const ROLE_OPTIONS: BusinessMemberRole[] = ["OWNER", "MANAGER", "STAFF"];

export interface TeamMemberData {
  id: string;
  role: BusinessMemberRole;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface TeamInvitationData {
  id: string;
  email: string;
  role: BusinessMemberRole;
  expiresAt: Date;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part!.charAt(0))
    .join("");
  return (initials || email.charAt(0)).toUpperCase();
}

// ─── Invite Form ────────────────────────────────────────────────

function InviteForm() {
  const initial: TeamActionState = { success: false };
  const [state, formAction, isPending] = useActionState(inviteMember, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" />
          Ekibe Davet Et
        </CardTitle>
        <CardDescription>
          E-posta adresine bir davet bağlantısı gönderin. Davet 7 gün
          boyunca geçerlidir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="invite-email">E-posta</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="ornek@eposta.com"
              required
              aria-invalid={!!state.errors?.email}
            />
            {state.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email}</p>
            )}
          </div>

          <div className="space-y-2 sm:w-44">
            <Label htmlFor="invite-role">Rol</Label>
            <Select name="role" defaultValue="STAFF">
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isPending}>
            <Mail className="size-4" />
            Davet Gönder
          </Button>
        </form>

        {state.message && state.success && (
          <p className="mt-3 text-sm text-success-foreground">{state.message}</p>
        )}
        {state.message && !state.success && (
          <p className="mt-3 text-sm text-destructive">{state.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Member Row ─────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  isLastOwner,
}: {
  member: TeamMemberData;
  isCurrentUser: boolean;
  isLastOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fullName = [member.user.firstName, member.user.lastName]
    .filter(Boolean)
    .join(" ");
  const locked = isLastOwner;

  function handleRoleChange(value: string | null) {
    if (!value || value === member.role) return;
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(member.id, value as BusinessMemberRole);
      if (!result.success) setError(result.message ?? "İşlem başarısız.");
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMember(member.id);
      if (!result.success) setError(result.message ?? "İşlem başarısız.");
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>
            {getInitials(member.user.firstName, member.user.lastName, member.user.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {fullName || member.user.email}
            {isCurrentUser && (
              <span className="ml-1.5 text-xs text-muted-foreground">(Siz)</span>
            )}
          </p>
          {fullName && (
            <p className="text-xs text-muted-foreground">{member.user.email}</p>
          )}
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {locked ? (
          <Badge variant={ROLE_BADGE_VARIANTS[member.role]}>
            {ROLE_LABELS[member.role]}
          </Badge>
        ) : (
          <Select
            value={member.role}
            onValueChange={handleRoleChange}
            disabled={isPending}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Üyeyi kaldır"
          disabled={isPending || locked}
          title={locked ? "En az bir işletme sahibi gereklidir." : "Üyeyi kaldır"}
          onClick={handleRemove}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
}

// ─── Invitation Row ─────────────────────────────────────────────

function InvitationRow({ invitation }: { invitation: TeamInvitationData }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(() => {
      cancelInvitation(invitation.id);
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{invitation.email}</p>
        <p className="text-xs text-muted-foreground">
          Son geçerlilik: {formatDate(invitation.expiresAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Badge variant={ROLE_BADGE_VARIANTS[invitation.role]}>
          {ROLE_LABELS[invitation.role]}
        </Badge>
        <Badge variant="warning">Beklemede</Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Daveti iptal et"
          disabled={isPending}
          onClick={handleCancel}
        >
          <X className="size-4" />
        </Button>
      </div>
    </li>
  );
}

// ─── Team Manager ───────────────────────────────────────────────

export function TeamManager({
  members,
  invitations,
  currentUserId,
}: {
  members: TeamMemberData[];
  invitations: TeamInvitationData[];
  currentUserId: string;
}) {
  const ownerCount = members.filter((m) => m.role === "OWNER").length;

  return (
    <div className="space-y-6">
      <InviteForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ekip Üyeleri
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({members.length})
            </span>
          </CardTitle>
          <CardDescription>
            İşletmenize erişimi olan kullanıcılar ve rolleri.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/50">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.user.id === currentUserId}
                isLastOwner={member.role === "OWNER" && ownerCount <= 1}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bekleyen Davetler</CardTitle>
            <CardDescription>
              Henüz kabul edilmemiş davetler.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/50">
              {invitations.map((invitation) => (
                <InvitationRow key={invitation.id} invitation={invitation} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
