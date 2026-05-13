import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Users,
  CalendarCheck,
  ImageIcon,
  MessageSquare,
  Clock,
} from "lucide-react";

interface DashboardStats {
  totalBusinesses: number;
  totalUsers: number;
  pendingApprovals: number;
  appointmentsThisWeek: number;
  hiddenMediaCount: number;
  pendingReviewCount: number;
}

const statConfig = [
  {
    key: "totalBusinesses" as const,
    label: "Total Businesses",
    icon: Building2,
  },
  { key: "totalUsers" as const, label: "Total Users", icon: Users },
  {
    key: "pendingApprovals" as const,
    label: "Pending Approvals",
    icon: Clock,
  },
  {
    key: "appointmentsThisWeek" as const,
    label: "Appointments (7d)",
    icon: CalendarCheck,
  },
  {
    key: "hiddenMediaCount" as const,
    label: "Hidden/Removed Media",
    icon: ImageIcon,
  },
  {
    key: "pendingReviewCount" as const,
    label: "Pending Reviews",
    icon: MessageSquare,
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statConfig.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats[key]}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
