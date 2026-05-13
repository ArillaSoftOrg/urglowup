import {
  getAdminDashboardStats,
  getRecentAdminActions,
} from "@/lib/queries/admin";
import { StatsCards } from "@/components/admin/stats-cards";
import { AdminActionLog } from "@/components/admin/admin-action-log";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, recentActions] = await Promise.all([
    getAdminDashboardStats(),
    getRecentAdminActions(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform.</p>
      </div>

      <StatsCards stats={stats} />
      <AdminActionLog actions={recentActions} />
    </div>
  );
}
