import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Scissors,
  Clock,
  CalendarCheck,
  CalendarPlus,
  Link2,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  CalendarDays,
  ImageIcon,
  CalendarClock,
  MessageCircle,
  UserPlus,
  Star,
  Eye,
  TrendingUp,
  CalendarRange,
} from "lucide-react";
import Link from "next/link";
import { nowInBusinessTimezone } from "@/lib/constants/booking";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { ProfileCompletionCard } from "@/components/business/profile-completion-card";
import { StatCard } from "@/components/business/stat-card";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Kontrol Paneli" };

const BUSINESS_STATUS_BADGE: Record<
  string,
  { variant: "success" | "warning" | "destructive" | "secondary"; label: string }
> = {
  ACTIVE_PRIVATE: { variant: "success", label: "Aktif (Özel)" },
  ACTIVE_MARKETPLACE: { variant: "success", label: "Vitrin" },
  PENDING_APPROVAL: { variant: "warning", label: "İnceleniyor" },
  DRAFT: { variant: "secondary", label: "Taslak" },
  SUSPENDED: { variant: "destructive", label: "Askıya Alındı" },
  REJECTED: { variant: "destructive", label: "Reddedildi" },
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  PENDING: "bg-warning",
  CONFIRMED: "bg-info",
  CHECKED_IN: "bg-info",
  COMPLETED: "bg-success",
  CANCELLED_BY_CUSTOMER: "bg-muted-foreground/40",
  CANCELLED_BY_BUSINESS: "bg-muted-foreground/40",
  REJECTED: "bg-destructive/60",
  NO_SHOW: "bg-muted-foreground/40",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylı",
  CHECKED_IN: "Geldi",
  COMPLETED: "Tamamlandı",
  CANCELLED_BY_CUSTOMER: "Müşteri iptali",
  CANCELLED_BY_BUSINESS: "İptal edildi",
  REJECTED: "Reddedildi",
  NO_SHOW: "Gelmedi",
};

type RecentAppointment = {
  id: string;
  status: AppointmentStatus;
  createdAt: Date;
  customer: { firstName: string | null; lastName: string | null };
  service: { name: string };
};

function relativeTime(date: Date, referenceDate: Date): string {
  const diffMs = referenceDate.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins || 1} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function ActivityFeed({
  appointments,
  referenceDate,
}: {
  appointments: RecentAppointment[];
  referenceDate: Date;
}) {
  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz randevu yok.</p>
      ) : (
        appointments.map((apt) => {
          const name = [apt.customer.firstName, apt.customer.lastName]
            .filter(Boolean)
            .join(" ") || "Müşteri";
          return (
            <Link
              key={apt.id}
              href={`/business/appointments?appointmentId=${apt.id}`}
              className="flex gap-3 text-sm hover:opacity-80"
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  STATUS_DOT[apt.status]
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[oklch(0.25_0.045_285)]">
                  {name} · {apt.service.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABEL[apt.status]} · {relativeTime(apt.createdAt, referenceDate)}
                </p>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}

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

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    business,
    activeServiceCount,
    ,
    hoursCount,
    pendingCount,
    todayCount,
    weekCount,
    monthStats,
    ratingStats,
    pageViewCount,
    recentAppointments,
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
    db.businessService.count({ where: { businessId, isActive: true } }),
    db.businessService.count({ where: { businessId } }),
    db.businessHour.count({ where: { businessId } }),
    db.appointment.count({ where: { businessId, status: "PENDING" } }),
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
    // Bu ay: tamamlanma ve iptal sayıları
    db.appointment.groupBy({
      by: ["status"],
      where: { businessId, createdAt: { gte: monthStart } },
      _count: { id: true },
    }),
    // Ortalama puan
    db.businessRatingStats.findUnique({
      where: { businessId },
      select: { bayesianScore: true, rawReviewCount: true },
    }),
    // 30 günlük profil görüntülenme
    db.businessPageView.count({
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Son 6 randevu (gerçek aktivite akışı)
    db.appointment.findMany({
      where: { businessId },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  if (!business) return null;

  // Bu ay hesaplamaları
  const monthByStatus = Object.fromEntries(
    monthStats.map((r) => [r.status, r._count.id])
  );
  const monthCompleted = monthByStatus["COMPLETED"] ?? 0;
  const monthTotal =
    Object.values(monthByStatus).reduce((s, c) => s + c, 0);
  const monthCancelledCount =
    (monthByStatus["CANCELLED_BY_CUSTOMER"] ?? 0) +
    (monthByStatus["CANCELLED_BY_BUSINESS"] ?? 0);
  const completionRate =
    monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : null;
  const cancellationRate =
    monthTotal > 0 ? Math.round((monthCancelledCount / monthTotal) * 100) : null;

  const hoursConfigured = hoursCount > 0;
  const completion = calculateProfileCompletion(business);
  const statusBadge =
    BUSINESS_STATUS_BADGE[business.status] ?? {
      variant: "secondary" as const,
      label: business.status,
    };

  const ratingDisplay =
    ratingStats?.bayesianScore != null
      ? (ratingStats.bayesianScore / 2).toFixed(1)
      : null;

  const quickActions = [
    {
      href: "/business/services",
      title: "Hizmetleri Yönet",
      description: "Hizmetleri ekle veya düzenle",
      icon: Scissors,
      tone: "bg-[oklch(0.94_0.045_285)] text-[oklch(0.48_0.17_285)]",
    },
    {
      href: "/business/media",
      title: "Medya Yükle",
      description: "Fotoğraf ve portfolyo ekle",
      icon: ImageIcon,
      tone: "bg-[oklch(0.94_0.05_75)] text-[oklch(0.44_0.13_65)]",
    },
    {
      href: "/business/hours",
      title: "Çalışma Saatleri",
      description: "Haftalık programı ayarla",
      icon: Clock,
      tone: "bg-[oklch(0.93_0.055_165)] text-[oklch(0.36_0.12_165)]",
    },
    {
      href: "/business/public-link",
      title: "Linki Paylaş",
      description: "QR kod, Instagram ve WhatsApp",
      icon: Link2,
      tone: "bg-[oklch(0.94_0.045_345)] text-[oklch(0.48_0.16_345)]",
    },
    {
      href: "/business/customers",
      title: "Yeni Müşteri",
      description: "Müşteri listesine git",
      icon: UserPlus,
      tone: "bg-[oklch(0.95_0.035_245)] text-[oklch(0.43_0.13_245)]",
    },
  ];

  const activityFeedContent = (
    <div className="space-y-4">
      {recentAppointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz randevu yok.</p>
      ) : (
        recentAppointments.map((apt) => {
          const name = [apt.customer.firstName, apt.customer.lastName]
            .filter(Boolean)
            .join(" ") || "Müşteri";
          return (
            <Link
              key={apt.id}
              href={`/business/appointments?appointmentId=${apt.id}`}
              className="flex gap-3 text-sm hover:opacity-80"
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  STATUS_DOT[apt.status]
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[oklch(0.25_0.045_285)]">
                  {name} · {apt.service.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABEL[apt.status]} · {relativeTime(apt.createdAt, now)}
                </p>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );

  void activityFeedContent;

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-[oklch(0.20_0.06_285)] md:text-3xl">
            Hoş geldiniz, {business.name} 👋
          </h1>
          <p className="mt-1.5 text-sm text-[oklch(0.46_0.045_285)] md:text-base">
            İşletmenizin genel durumunu buradan takip edebilirsiniz.
          </p>
        </div>
        <Badge variant={statusBadge.variant} className="shrink-0 rounded-full px-3">
          {statusBadge.label}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          {/* ── Bugünkü Özet ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight text-[oklch(0.20_0.06_285)] md:text-xl">
              Bugünkü Özet
            </h2>
            <Link
              href="/business/appointments"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[oklch(0.50_0.18_285)] transition-colors hover:text-[oklch(0.42_0.18_285)]"
            >
              Tümünü görüntüle
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {(pendingCount > 0 || todayCount > 0 || weekCount > 0) && (
            <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
              {pendingCount > 0 && (
                <StatCard
                  icon={AlertCircle}
                  label="Bekleyen"
                  value={pendingCount}
                  hint="Yanıtınızı bekliyor"
                  href="/business/appointments?tab=pending"
                  iconTone="warning"
                  size="compact"
                />
              )}
              {todayCount > 0 && (
                <StatCard
                  icon={CalendarCheck}
                  label="Bugün"
                  value={todayCount}
                  hint="Onaylanan randevular"
                  iconTone="pink"
                  size="compact"
                />
              )}
              {weekCount > 0 && (
                <StatCard
                  icon={CalendarDays}
                  label="Bu Hafta"
                  value={weekCount}
                  hint="Bu hafta toplam"
                  iconTone="info"
                  size="compact"
                />
              )}
            </div>
          )}

          {/* ── Bu Ay Performansı ── */}
          {monthTotal > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold tracking-tight text-[oklch(0.20_0.06_285)] md:text-xl">
                Bu Ay
              </h2>
              <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4">
                <StatCard
                  icon={CalendarRange}
                  label="Toplam Randevu"
                  value={monthTotal}
                  hint="Bu ay oluşturulan"
                  iconTone="pink"
                  size="compact"
                />
                {completionRate !== null && (
                  <StatCard
                    icon={TrendingUp}
                    label="Tamamlanma"
                    value={`%${completionRate}`}
                    hint={`${monthCompleted} randevu tamamlandı`}
                    iconTone="info"
                    size="compact"
                  />
                )}
                {cancellationRate !== null && cancellationRate > 0 && (
                  <StatCard
                    icon={AlertCircle}
                    label="İptal Oranı"
                    value={`%${cancellationRate}`}
                    hint={`${monthCancelledCount} randevu iptal`}
                    iconTone="warning"
                    size="compact"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Genel Metrikler ── */}
          {(ratingDisplay || pageViewCount > 0) && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold tracking-tight text-[oklch(0.20_0.06_285)] md:text-xl">
                Genel Metrikler
              </h2>
              <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:gap-4">
                {ratingDisplay && (
                  <StatCard
                    icon={Star}
                    label="Ortalama Puan"
                    value={`${ratingDisplay} ★`}
                    hint={`${ratingStats?.rawReviewCount ?? 0} değerlendirme`}
                    href="/business/reviews"
                    iconTone="warning"
                    size="compact"
                  />
                )}
                {pageViewCount > 0 && (
                  <StatCard
                    icon={Eye}
                    label="Profil Görüntülenme"
                    value={pageViewCount}
                    hint="Son 30 gün"
                    href="/business/public-link"
                    iconTone="info"
                    size="compact"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <Link
            href="/business/appointments"
            className="group flex items-center gap-4 rounded-xl bg-[oklch(0.54_0.20_285)] px-4 py-4 text-white shadow-[0_12px_26px_oklch(0.36_0.16_285_/_0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[oklch(0.50_0.20_285)] sm:px-5"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/16 text-white ring-1 ring-white/12">
              <CalendarPlus className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold sm:text-lg">Yeni Randevu Oluştur</span>
              <span className="block text-sm text-white/78">Hızlı randevu oluşturun</span>
            </span>
            <ChevronRight className="size-6 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {completion.score < 100 && (
            <ProfileCompletionCard completion={completion} />
          )}

          <div className="grid gap-2 rounded-xl border border-[oklch(0.90_0.014_285)] bg-card px-4 py-3 text-sm shadow-xs sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:px-5">
            <Link
              href="/business/services"
              className="flex items-center gap-2 text-[oklch(0.43_0.045_285)] transition-colors hover:text-foreground"
            >
              <Scissors className="size-4 shrink-0" />
              <span>
                <span className="font-semibold text-foreground">{activeServiceCount}</span>
                {" "}aktif hizmet
              </span>
            </Link>
            <span className="hidden select-none text-muted-foreground/35 sm:inline">·</span>
            <Link
              href="/business/hours"
              className="flex items-center gap-2 text-[oklch(0.43_0.045_285)] transition-colors hover:text-foreground"
            >
              <Clock className="size-4 shrink-0" />
              <span>{hoursConfigured ? "Saatler ayarlı" : "Saatler ayarlanmadı"}</span>
            </Link>
            <span className="hidden select-none text-muted-foreground/35 sm:inline">·</span>
            <Link
              href="/business/public-link"
              className="flex items-center gap-2 font-mono text-xs text-[oklch(0.43_0.045_285)] transition-colors hover:text-foreground"
            >
              <Link2 className="size-4 shrink-0" />
              <span>/b/{business.slug}</span>
            </Link>
          </div>

          <section>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[oklch(0.48_0.055_285)]">
              Hızlı İşlemler
            </p>
            <div className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-3 lg:grid-cols-5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "group h-auto min-h-[104px] flex-col items-center justify-center gap-2 whitespace-normal rounded-xl border-[oklch(0.90_0.015_285)] bg-[oklch(0.997_0.004_285)] px-2.5 py-3 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-[oklch(0.82_0.045_285)] hover:bg-card hover:shadow-sm sm:min-h-[116px] sm:px-3 sm:py-4"
                    )}
                  >
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", action.tone)}>
                      <Icon className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold leading-snug text-[oklch(0.21_0.055_285)] sm:text-sm">
                        {action.title}
                      </span>
                      <span className="mt-1 hidden text-xs leading-5 text-[oklch(0.46_0.045_285)] sm:block">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight className="hidden size-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Son Aktiviteler (mobil) ── */}
          <section className="xl:hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-[oklch(0.20_0.06_285)] md:text-xl">
                Son Aktiviteler
              </h2>
              <Link
                href="/business/appointments"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[oklch(0.50_0.18_285)] transition-colors hover:text-[oklch(0.42_0.18_285)]"
              >
                Tümünü görüntüle
                <ChevronRight className="size-4" />
              </Link>
            </div>
            <Card className="border-[oklch(0.91_0.015_285)] bg-card shadow-sm">
              <CardContent className="p-4">
                <ActivityFeed appointments={recentAppointments} referenceDate={now} />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden space-y-4 xl:block">
          {(pendingCount > 0 || todayCount > 0 || weekCount > 0) && (
            <Card className="border-[oklch(0.91_0.015_285)] bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.94_0.045_345)] text-[oklch(0.48_0.16_345)]">
                    <CalendarClock className="size-5" />
                  </span>
                  <p className="text-base font-semibold text-[oklch(0.21_0.055_285)]">
                    Yaklaşan Randevular
                  </p>
                </div>
                <div className="space-y-2">
                  {pendingCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-[oklch(0.985_0.01_285)] px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Bekleyen</span>
                      <span className="font-bold tabular-nums">{pendingCount}</span>
                    </div>
                  )}
                  {todayCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-[oklch(0.985_0.01_285)] px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Bugün onaylı</span>
                      <span className="font-bold tabular-nums">{todayCount}</span>
                    </div>
                  )}
                  {weekCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-[oklch(0.985_0.01_285)] px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Bu hafta toplam</span>
                      <span className="font-bold tabular-nums">{weekCount}</span>
                    </div>
                  )}
                </div>
                <Link
                  href="/business/appointments"
                  className="mt-4 flex items-center gap-1 text-sm font-semibold text-[oklch(0.50_0.18_285)] hover:underline"
                >
                  Tüm randevuları görüntüle
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="border-[oklch(0.91_0.015_285)] bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="mb-5 text-base font-semibold text-[oklch(0.21_0.055_285)]">
                Son Aktiviteler
              </p>
              <ActivityFeed appointments={recentAppointments} referenceDate={now} />
              <Link
                href="/business/appointments"
                className="mt-5 flex items-center gap-1 text-sm font-semibold text-[oklch(0.50_0.18_285)] hover:underline"
              >
                Tüm randevuları görüntüle
                <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Link
        href="/business/appointments"
        aria-label="Yardım ve mesajlar"
        className="fixed bottom-6 right-6 z-40 hidden size-14 items-center justify-center rounded-full bg-business-nav text-business-nav-fg shadow-lg transition-transform hover:-translate-y-0.5 md:flex"
      >
        <MessageCircle className="size-6" />
      </Link>
    </div>
  );
}
