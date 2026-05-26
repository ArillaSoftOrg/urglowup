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
    <div className="space-y-4">
      {/* Compact header: business name + status badge */}
      <div className="flex items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight">
          {business.name}
        </h1>
        <Badge variant={statusBadge.variant} className="shrink-0">
          {statusBadge.label}
        </Badge>
      </div>

      {completion.score < 100 && (
        <ProfileCompletionCard completion={completion} />
      )}

      {/* Operational stats — always 3 columns */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          icon={AlertCircle}
          label="Bekleyen"
          value={pendingCount}
          hint={pendingCount > 0 ? "Yanıtınızı bekliyor" : "Yeni talep yok"}
          href="/business/appointments?tab=pending"
          iconTone="warning"
          size="sm"
        />
        <StatCard
          icon={CalendarCheck}
          label="Bugün"
          value={todayCount}
          hint={todayCount > 0 ? "Onaylanan randevular" : "Bugün randevu yok"}
          iconTone="pink"
          size="sm"
        />
        <StatCard
          icon={CalendarDays}
          label="Bu Hafta"
          value={weekCount}
          hint="Bu hafta toplam"
          iconTone="info"
          size="sm"
        />
      </div>

      {/* Config status strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border bg-card px-4 py-2.5 text-sm">
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
      <Card className="bg-surface-cream">
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Hızlı İşlemler
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link
              href="/business/services"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto whitespace-normal justify-start gap-3 bg-card px-3 py-3 sm:px-4"
              )}
            >
              <Scissors className="size-5 shrink-0" />
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
                "h-auto whitespace-normal justify-start gap-3 bg-card px-3 py-3 sm:px-4"
              )}
            >
              <ImageIcon className="size-5 shrink-0" />
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
                "h-auto whitespace-normal justify-start gap-3 bg-card px-3 py-3 sm:px-4"
              )}
            >
              <Clock className="size-5 shrink-0" />
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
                "h-auto whitespace-normal justify-start gap-3 bg-card px-3 py-3 sm:px-4"
              )}
            >
              <Link2 className="size-5 shrink-0" />
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
  );
}
