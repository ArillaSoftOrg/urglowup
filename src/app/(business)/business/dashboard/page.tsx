import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
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
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { nowInBusinessTimezone } from "@/lib/constants/booking";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { ProfileCompletionCard } from "@/components/business/profile-completion-card";
import { StatCard } from "@/components/business/stat-card";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { env } from "@/lib/env";

export const metadata = { title: "Dashboard" };

const BUSINESS_STATUS_BADGE: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "secondary"; label: string }
> = {
  ACTIVE_PRIVATE: { variant: "success", label: "Active (Private)" },
  ACTIVE_MARKETPLACE: { variant: "success", label: "Marketplace" },
  PENDING_APPROVAL: { variant: "warning", label: "Pending Review" },
  DRAFT: { variant: "secondary", label: "Draft" },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  REJECTED: { variant: "destructive", label: "Rejected" },
};

export default async function DashboardPage() {
  const { businessId } = await requireBusiness();

  const now = nowInBusinessTimezone();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

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
      select: {
        name: true,
        slug: true,
        status: true,
        description: true,
        phone: true,
        whatsapp: true,
        city: true,
        address: true,
        coverImageUrl: true,
        logoUrl: true,
        categories: { select: { categoryId: true } },
        services: { where: { isActive: true }, select: { id: true } },
        hours: { where: { isOpen: true }, select: { id: true } },
        media: {
          where: {
            status: "ACTIVE",
            type: { in: ["PORTFOLIO_IMAGE", "PORTFOLIO_VIDEO", "BEFORE_AFTER"] },
          },
          select: { id: true },
        },
      },
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
  const completion = calculateProfileCompletion(business);
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const publicUrl = `${appUrl}/b/${business.slug}`;
  const statusBadge =
    BUSINESS_STATUS_BADGE[business.status] ?? { variant: "secondary" as const, label: business.status };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Dashboard"
        description={`Welcome back, ${business.name}`}
      />

      {completion.score < 100 && (
        <ProfileCompletionCard completion={completion} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={AlertCircle}
          label="Pending Requests"
          value={pendingCount}
          hint="Awaiting your response"
          href="/business/appointments?tab=pending"
          iconTone="warning"
        />
        <StatCard
          icon={CalendarCheck}
          label="Today's Appointments"
          value={todayCount}
          hint="Confirmed for today"
          iconTone="pink"
        />
        <StatCard
          icon={CalendarDays}
          label="This Week"
          value={weekCount}
          hint="Pending + confirmed"
          iconTone="info"
        />
        <StatCard
          icon={Scissors}
          label="Active Services"
          value={activeServiceCount}
          hint={`${totalServiceCount} total service${totalServiceCount !== 1 ? "s" : ""}`}
          href="/business/services"
          iconTone="pink"
        />
        <StatCard
          icon={Clock}
          label="Working Hours"
          value={
            <Badge variant={hoursConfigured ? "success" : "secondary"}>
              {hoursConfigured ? "Configured" : "Not set"}
            </Badge>
          }
          hint={
            hoursConfigured ? "Weekly schedule is set up" : "Set your working hours"
          }
          href="/business/hours"
          iconTone="muted"
        />
        <StatCard
          icon={Link2}
          label="Public Link"
          value={
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          }
          hint={`/b/${business.slug}`}
          href="/business/public-link"
          iconTone="muted"
        />
      </div>

      <Card className="bg-surface-cream">
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Quick Actions
          </p>
          <CardTitle className="text-lg">Jump to common tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/business/services"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 bg-card px-4 py-3"
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
                "h-auto justify-start gap-3 bg-card px-4 py-3"
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
              href="/business/media"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 bg-card px-4 py-3"
              )}
            >
              <ImageIcon className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Upload Media</p>
                <p className="text-xs text-muted-foreground">
                  Add photos and portfolio
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>

            <Link
              href="/business/appointments"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 bg-card px-4 py-3"
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

            <Link
              href="/business/public-link"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 bg-card px-4 py-3"
              )}
            >
              <Link2 className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Share Booking Link</p>
                <p className="text-xs text-muted-foreground">
                  QR code, Instagram &amp; WhatsApp
                </p>
              </div>
              <ArrowRight className="ml-auto size-4 shrink-0" />
            </Link>

            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto justify-start gap-3 bg-card px-4 py-3"
              )}
            >
              <ExternalLink className="size-5 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">View Public Profile</p>
                <p className="text-xs text-muted-foreground">
                  See your booking page
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
