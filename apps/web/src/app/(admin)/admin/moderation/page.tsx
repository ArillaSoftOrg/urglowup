import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminModerationQueue, getAdminModerationStats } from "@/lib/admin/moderation-queue";
import { ModerationQueueList } from "@/components/admin/moderation-queue-list";
import { ModerationStatsBar } from "@/components/admin/moderation-stats-bar";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

export default async function ModerationPage() {
  await requireRole(UserRole.ADMIN);

  const [queue, stats] = await Promise.all([
    getAdminModerationQueue({ limit: 50 }),
    getAdminModerationStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moderation Hub</h1>
      </div>

      <ModerationStatsBar stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Content Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.total === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content in queue
            </div>
          ) : (
            <ModerationQueueList items={queue.items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
