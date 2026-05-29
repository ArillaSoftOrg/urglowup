import Link from "next/link";
import {
  Users,
  Building2,
  CalendarCheck,
  MessageSquare,
  ImageOff,
  Clock,
  FileText,
  UserPlus,
  AlertCircle,
  TrendingDown,
  Ban,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminDashboardMetrics } from "@/lib/queries/admin";

interface KpiGridProps {
  metrics: AdminDashboardMetrics;
}

export function KpiGrid({ metrics }: KpiGridProps) {
  const cards = [
    {
      label: "Total Users",
      value: metrics.totalUsers,
      delta: metrics.newUsersLast7d,
      deltaLabel: "new this week",
      icon: Users,
      href: "/admin/users",
      alert: false,
    },
    {
      label: "Unverified Users",
      value: metrics.unverifiedUserCount,
      icon: AlertCircle,
      href: "/admin/users?lifecycle=UNVERIFIED",
      alert: metrics.unverifiedUserCount > 0,
    },
    {
      label: "Inactive Users (90d+)",
      value: metrics.inactiveUserCount,
      icon: Clock,
      href: "/admin/users?lifecycle=INACTIVE",
      alert: metrics.inactiveUserCount > 0,
    },
    {
      label: "Churned Users (180d+)",
      value: metrics.churnedUserCount,
      icon: TrendingDown,
      href: "/admin/users?lifecycle=CHURNED",
      alert: metrics.churnedUserCount > 0,
    },
    {
      label: "Suspended Users",
      value: metrics.suspendedUserCount,
      icon: Ban,
      href: "/admin/users?lifecycle=SUSPENDED",
      alert: metrics.suspendedUserCount > 0,
    },
    {
      label: "Active Marketplace",
      value: metrics.businessCounts["ACTIVE_MARKETPLACE"] ?? 0,
      icon: Building2,
      href: "/admin/businesses",
      alert: false,
    },
    {
      label: "Appointments (7d)",
      value: metrics.appointmentsThisWeek,
      delta:
        metrics.appointmentsThisWeek -
        (metrics.appointmentsLastWeek || metrics.appointmentsThisWeek),
      deltaLabel:
        metrics.appointmentsThisWeek >
        (metrics.appointmentsLastWeek || 0)
          ? "vs last week"
          : "vs last week",
      icon: CalendarCheck,
      href: "/admin/appointments",
      alert: false,
    },
    {
      label: "Pending Reviews",
      value: metrics.pendingReviewCount,
      icon: MessageSquare,
      href: "/admin/reviews",
      alert: metrics.pendingReviewCount > 20,
    },
    {
      label: "Hidden/Removed Media",
      value: metrics.hiddenMediaCount,
      icon: ImageOff,
      href: "/admin/media",
      alert: metrics.hiddenMediaCount > 0,
    },
    {
      label: "Pending Approvals",
      value: metrics.pendingApprovals,
      icon: Clock,
      href: "/admin/businesses",
      alert: metrics.pendingApprovals > 0,
    },
    {
      label: "Active Posts",
      value: metrics.postStatusCounts["ACTIVE"] ?? 0,
      icon: FileText,
      href: "/admin/posts",
      alert: false,
    },
    {
      label: "New Signups (7d)",
      value: metrics.newUsersLast7d,
      icon: UserPlus,
      href: "/admin/users",
      alert: false,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, delta, deltaLabel, icon: Icon, href, alert }) => (
        <Link key={label} href={href} className="group">
          <Card className="relative h-full transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                <Icon className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
                {delta !== undefined && delta !== 0 && (
                  <p
                    className={`text-xs ${
                      delta > 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}{delta} {deltaLabel}
                  </p>
                )}
              </div>
              {alert && value > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-2 right-2"
                >
                  Alert
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
