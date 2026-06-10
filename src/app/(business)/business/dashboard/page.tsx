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
  Link2,
  ArrowRight,
  AlertCircle,
  CalendarDays,
  ImageIcon,
  CalendarClock,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { nowInBusinessTimezone } from "@/lib/constants/booking";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { ProfileCompletionCard } from "@/components/business/profile-completion-card";
import { StatCard } from "@/components/business/stat-card";

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
    ,
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
  const statusBadge =
    BUSINESS_STATUS_BADGE[business.status] ?? {
      variant: "secondary" as const,
      label: business.status,
    };

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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[oklch(0.20_0.06_285)] md:text-3xl">
            Hoş geldiniz, {business.name} 👋
          </h1>
          <p className="mt-2 text-sm text-[oklch(0.46_0.045_285)]">
            İşletmenizin genel durumunu buradan takip edebilirsiniz.
          </p>
        </div>
        <Badge variant={statusBadge.variant} className="mt-1 shrink-0 rounded-full px-3">
          {statusBadge.label}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={AlertCircle}
              label="Bekleyen"
              value={pendingCount}
              hint={pendingCount > 0 ? "Yanıtınızı bekliyor" : "Yeni talep yok"}
              href="/business/appointments?tab=pending"
              iconTone="warning"
            />
            <StatCard
              icon={CalendarCheck}
              label="Bugün"
              value={todayCount}
              hint={todayCount > 0 ? "Onaylanan randevular" : "Bugün randevu yok"}
              iconTone="pink"
            />
            <StatCard
              icon={CalendarDays}
              label="Bu Hafta"
              value={weekCount}
              hint="Bu hafta toplam"
              iconTone="info"
            />
          </div>

          {completion.score < 100 && (
            <ProfileCompletionCard completion={completion} />
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[oklch(0.90_0.014_285)] bg-card px-5 py-3 text-sm shadow-xs">
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
            <span className="select-none text-muted-foreground/35">·</span>
            <Link
              href="/business/hours"
              className="flex items-center gap-2 text-[oklch(0.43_0.045_285)] transition-colors hover:text-foreground"
            >
              <Clock className="size-4 shrink-0" />
              <span>{hoursConfigured ? "Saatler ayarlı" : "Saatler ayarlanmadı"}</span>
            </Link>
            <span className="select-none text-muted-foreground/35">·</span>
            <Link
              href="/business/public-link"
              className="flex items-center gap-2 font-mono text-xs text-[oklch(0.43_0.045_285)] transition-colors hover:text-foreground"
            >
              <Link2 className="size-4 shrink-0" />
              <span>/b/{business.slug}</span>
            </Link>
          </div>

          <Card className="border-[oklch(0.91_0.015_285)] bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[oklch(0.48_0.055_285)]">
                Hızlı İşlemler
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "group h-auto min-h-24 justify-start whitespace-normal rounded-xl border-[oklch(0.90_0.015_285)] bg-[oklch(0.997_0.004_285)] px-4 py-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-[oklch(0.82_0.045_285)] hover:bg-card hover:shadow-sm"
                      )}
                    >
                      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", action.tone)}>
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[oklch(0.21_0.055_285)]">
                          {action.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[oklch(0.46_0.045_285)]">
                          {action.description}
                        </span>
                      </span>
                      <ArrowRight className="ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="hidden space-y-4 xl:block">
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
                <div className="flex items-center justify-between rounded-lg bg-[oklch(0.985_0.01_285)] px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Bekleyen</span>
                  <span className="font-bold tabular-nums">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[oklch(0.985_0.01_285)] px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Bugün onaylı</span>
                  <span className="font-bold tabular-nums">{todayCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[oklch(0.985_0.01_285)] px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Bu hafta toplam</span>
                  <span className="font-bold tabular-nums">{weekCount}</span>
                </div>
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

          <Card className="border-[oklch(0.91_0.015_285)] bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="mb-5 text-base font-semibold text-[oklch(0.21_0.055_285)]">
                Son Aktiviteler
              </p>
              <div className="space-y-4">
                <div className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 rounded-full bg-[oklch(0.66_0.16_165)]" />
                  <div>
                    <p className="font-medium text-[oklch(0.25_0.045_285)]">
                      Profil bilgileri güncellendi
                    </p>
                    <p className="text-xs text-muted-foreground">2 gün önce</p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 rounded-full bg-[oklch(0.62_0.16_245)]" />
                  <div>
                    <p className="font-medium text-[oklch(0.25_0.045_285)]">
                      Çalışma saatleri ayarlandı
                    </p>
                    <p className="text-xs text-muted-foreground">5 gün önce</p>
                  </div>
                </div>
              </div>
              <Link
                href="/business/settings"
                className="mt-5 flex items-center gap-1 text-sm font-semibold text-[oklch(0.50_0.18_285)] hover:underline"
              >
                Tüm aktiviteleri görüntüle
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
