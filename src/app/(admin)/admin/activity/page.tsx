import { ActivityIcon } from "lucide-react";

export const metadata = { title: "Admin - Activity Log" };

export default function AdminActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          Track admin actions and system events.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-muted/20 py-16 text-center">
        <ActivityIcon className="size-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="font-medium">Activity log coming soon</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Admin activity tracking will be available in a future phase.
          </p>
        </div>
      </div>
    </div>
  );
}
