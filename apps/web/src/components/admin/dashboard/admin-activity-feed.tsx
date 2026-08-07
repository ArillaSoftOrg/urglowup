import Link from "next/link";
import { format } from "date-fns";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { AdminAction } from "@/lib/queries/admin";

interface AdminActivityFeedProps {
  actions: AdminAction[];
}

const ACTION_TYPE_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  "business.activate_private": { label: "Approved", variant: "success" },
  "business.activate_marketplace": { label: "Published", variant: "success" },
  "business.reject": { label: "Rejected", variant: "destructive" },
  "business.suspend": { label: "Suspended", variant: "destructive" },
  "business.toggle_marketplace": { label: "Toggled", variant: "info" },
  "review.approve": { label: "Review ✓", variant: "success" },
  "review.hide": { label: "Review —", variant: "neutral" },
  "review.remove": { label: "Review ✕", variant: "destructive" },
  "review.restore": { label: "Restored", variant: "success" },
  "media.hide": { label: "Media —", variant: "neutral" },
  "media.remove": { label: "Media ✕", variant: "destructive" },
  "media.restore": { label: "Restored", variant: "success" },
  "user.change_role": { label: "Role", variant: "info" },
  "category.create": { label: "Category +", variant: "success" },
  "category.update": { label: "Category", variant: "info" },
  "category.delete": { label: "Category —", variant: "destructive" },
  "appointment.override_status": { label: "Appointment", variant: "warning" },
  "appointment.bulk_cancel": { label: "Cancelled", variant: "destructive" },
};

const DEFAULT_CONFIG = { label: "Action", variant: "outline" as const };

function getActionConfig(actionType: string) {
  return ACTION_TYPE_CONFIG[actionType] || DEFAULT_CONFIG;
}

function getTargetLink(targetType: string, targetId: string): string | null {
  switch (targetType) {
    case "Business":
      return `/admin/businesses/${targetId}`;
    case "Review":
      return `/admin/reviews`;
    case "BusinessMedia":
      return `/admin/media`;
    case "User":
      return `/admin/users`;
    default:
      return null;
  }
}

export function AdminActivityFeed({ actions }: AdminActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardAction>
          <Link href="/admin/activity" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => {
            const config = getActionConfig(action.action);
            const targetLink = getTargetLink(action.targetType, action.targetId);
            const actorInitials = `${action.admin?.firstName?.[0] || "?"}${
              action.admin?.lastName?.[0] || "?"
            }`.toUpperCase();

            return (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {actorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{action.admin?.firstName}</span>
                    <Badge variant={config.variant}>
                      {config.label}
                    </Badge>
                  </div>
                  {targetLink ? (
                    <Link
                      href={targetLink}
                      className="text-xs text-primary hover:underline break-all"
                    >
                      {action.targetType} {action.targetId.slice(0, 8)}…
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground break-all">
                      {action.targetType} {action.targetId.slice(0, 8)}…
                    </p>
                  )}
                  {action.details && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {action.details}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {format(new Date(action.createdAt), "MMM d HH:mm")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
