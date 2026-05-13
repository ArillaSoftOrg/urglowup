import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Scissors,
  Clock,
  CalendarCheck,
  Link2,
  ArrowRight,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { nowInBusinessTimezone } from "@/lib/constants/booking";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { businessId } = await requireBusiness();

  const now = nowInBusinessTimezone();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Week boundaries (Monday–Sunday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    business,
    activeServiceCount,
    totalServiceCount,
    hoursCount,
    pendingCount,
    todayCount,
    weekCount,
  ] = await Promise.all([
    db.business.findUnique({
      where: { id: businessId },
      select: { name: true, slug: true, status: true },
    }),
    db.businessService.count({
      where: { businessId, isActive: true },
    }),
    db.businessService.count({
      where: { businessId },
    }),
    db.businessHour.count({
      where: { businessId },
    }),
    db.appointment.count({
      where: { businessId, status: "PENDING" },
    }),
    db.appointment.count({
      where: {
        businessId,
        status: "CONFIRMED",
        requestedDate: { gte: todayStart, lt: todayEnd },
      },
    }),
    db.appointment.count({
      where: {
        businessId,
        requestedDate: { gte: weekStart, lt: weekEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  if (!business) return null;

  const hoursConfigured = hoursCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {business.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/business/appointments?tab=pending">
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <AlertCircle className="size-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your response
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Appointments
            </CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekCount}</div>
            <p className="text-xs text-muted-foreground">
              Pending + confirmed this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Scissors className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServiceCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalServiceCount} total service
              {totalServiceCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Working Hours
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={hoursConfigured ? "default" : "secondary"}>
              {hoursConfigured ? "Configured" : "Not set"}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {hoursConfigured
                ? "Weekly schedule is set up"
                : "Set your working hours"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Public Link</CardTitle>
            <Link2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                business.status === "ACTIVE_PRIVATE" ||
                business.status === "ACTIVE_MARKETPLACE"
                  ? "default"
                  : "secondary"
              }
            >
              {business.status.replace(/_/g, " ").toLowerCase()}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              /b/{business.slug}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Jump to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/business/services"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 px-4 py-3"
              )}
            >
              <Scissors className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Manage Services</p>
                <p className="text-xs text-muted-foreground">
                  Add or edit your services
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>

            <Link
              href="/business/hours"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 px-4 py-3"
              )}
            >
              <Clock className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Working Hours</p>
                <p className="text-xs text-muted-foreground">
                  Set your weekly schedule
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>

            <Link
              href="/business/public-link"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 px-4 py-3"
              )}
            >
              <Link2 className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Public Link</p>
                <p className="text-xs text-muted-foreground">
                  Share your booking page
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>

            <Link
              href="/business/appointments"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 px-4 py-3"
              )}
            >
              <CalendarCheck className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Appointments</p>
                <p className="text-xs text-muted-foreground">
                  View appointment requests
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
