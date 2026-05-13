import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminAction } from "@/lib/queries/admin";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAdminName(admin: AdminAction["admin"]): string {
  return [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email;
}

export function AdminActionLog({ actions }: { actions: AdminAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Admin Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No admin actions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-start justify-between gap-2 border-b pb-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">
                      {formatAdminName(action.admin)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {action.action}
                    </span>
                  </p>
                  {action.details && (
                    <p className="truncate text-xs text-muted-foreground">
                      {action.details}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(action.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
