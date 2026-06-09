import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
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
  ImageIcon,
  CalendarClock,
  TrendingUp,
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
    BUSINESS_STATUS_BADGE[business.status] ?? { variant: "secondary" as const, label: business.status };

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hoş geldiniz, {business.name} 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            İşletmenizi yönetmek için aşağıdaki araçları kullanın.
          </p>
        </div>
        <Badge variant={statusBadge.variant} className="shrink-0 mt-1">
          {statusBadge.label}
        </Badge>
      </div>

      {/* Desktop: two-column layout; mobile: single column */}
      <div className="grid gap-5 lg:grid-cols-[1fr_288px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
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

          {/* Config status strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border bg-card px-4 py-2.5 text-sm shadow-xs">
            <Link
              href="/business/services"
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Scissors className="size-3.5 shrink-0" />
              <span>
                <span className="font-semibold text-foreground">{activeServiceCount}</span>
                {" "}aktif hizmet
              </span>
            </Link>
            <span className="select-none text-muted-foreground/40">·</span>
            <Link
              href="/business/hours"
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Clock className="size-3.5 shrink-0" />
              <span>{hoursConfigured ? "Saatler ayarlı" : "Saatler ayarlanmadı"}</span>
            </Link>
            <span className="select-none text-muted-foreground/40">·</span>
            <Link
              href="/business/public-link"
              className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Link2 className="size-3.5 shrink-0" />
              <span>/b/{business.slug}</span>
            </Link>
          </div>

          {/* Quick actions */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Hızlı İşlemler
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Link
                  href="/business/services"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto whitespace-normal justify-start gap-3 bg-surface-pink/30 px-3 py-3 sm:px-4 hover:bg-surface-pink/60"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-pink/20 text-brand-pink-foreground">
                    <Scissors className="size-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium">Hizmetleri Yönet</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      Hizmetleri ekle veya düzenle
                    </p>
                  </div>
                  <ArrowRight className="ml-auto size-4 shrink-0 hidden sm:block" />
                </Link>

                <Link
                  href="/business/media"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto whitespace-normal justify-start gap-3 bg-info/10 px-3 py-3 sm:px-4 hover:bg-info/20"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info/20 text-info-foreground">
                    <ImageIcon className="size-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium">Medya Yükle</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      Fotoğraf ve portfolyo ekle
                    </p>
                  </div>
                  <ArrowRight className="ml-auto size-4 shrink-0 hidden sm:block" />
                </Link>

                <Link
                  href="/business/hours"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto whitespace-normal justify-start gap-3 bg-warning/10 px-3 py-3 sm:px-4 hover:bg-warning/20"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/30 text-warning-foreground">
                    <Clock className="size-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium">Çalışma Saatleri</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      Haftalık programı ayarla
                    </p>
                  </div>
                  <ArrowRight className="ml-auto size-4 shrink-0 hidden sm:block" />
                </Link>

                <Link
                  href="/business/public-link"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-auto whitespace-normal justify-start gap-3 bg-success/10 px-3 py-3 sm:px-4 hover:bg-success/20"
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/30 text-success-foreground">
                    <Link2 className="size-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium">Linki Paylaş</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      QR kod, Instagram ve WhatsApp
                    </p>
                  </div>
                  <ArrowRight className="ml-auto size-4 shrink-0 hidden sm:block" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column (desktop only) */}
        <div className="hidden space-y-4 lg:block">
          {/* Appointment summary */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-pink/15 text-brand-pink-foreground">
                  <CalendarClock className="size-4" />
                </span>
                <p className="text-sm font-semibold">Randevular</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              <div className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Bekleyen</span>
                <span className="font-bold text-warning-foreground">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Bugün onaylı</span>
                <span className="font-bold">{todayCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Bu hafta toplam</span>
                <span className="font-bold">{weekCount}</span>
              </div>
              <Link
                href="/business/appointments"
                className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-pink-foreground hover:underline"
              >
                Tüm randevuları gör
                <ArrowRight className="size-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-info/20 text-info-foreground">
                  <TrendingUp className="size-4" />
                </span>
                <p className="text-sm font-semibold">Hızlı Erişim</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 pb-4">
              {[
                { href: "/business/profile", label: "Profil bilgileri" },
                { href: "/business/hours", label: "Çalışma saatleri" },
                { href: "/business/reviews", label: "Değerlendirmeler" },
                { href: "/business/settings", label: "Ayarlar" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  {label}
                  <ArrowRight className="size-3.5 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
