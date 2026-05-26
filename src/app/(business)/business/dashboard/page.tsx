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
import { getAppUrl } from "@/lib/get-app-url";

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
  const publicUrl = getAppUrl(`/b/${business.slug}`);
  const statusBadge =
    BUSINESS_STATUS_BADGE[business.status] ?? { variant: "secondary" as const, label: business.status };

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Kontrol Paneli"
        description={`Tekrar hoş geldiniz, ${business.name}`}
      />

      {completion.score < 100 && (
        <ProfileCompletionCard completion={completion} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={AlertCircle}
          label="Bekleyen Talepler"
          value={pendingCount}
          hint="Yanıtınızı bekliyor"
          href="/business/appointments?tab=pending"
          iconTone="warning"
        />
        <StatCard
          icon={CalendarCheck}
          label="Bugünkü Randevular"
          value={todayCount}
          hint="Bugün için onaylananlar"
          iconTone="pink"
        />
        <StatCard
          icon={CalendarDays}
          label="Bu Hafta"
          value={weekCount}
          hint="Bekleyen + onaylanan"
          iconTone="info"
        />
        <StatCard
          icon={Scissors}
          label="Aktif Hizmetler"
          value={activeServiceCount}
          hint={`Toplam: ${totalServiceCount} hizmet`}
          href="/business/services"
          iconTone="pink"
        />
        <StatCard
          icon={Clock}
          label="Çalışma Saatleri"
          value={
            <Badge variant={hoursConfigured ? "success" : "secondary"}>
              {hoursConfigured ? "Ayarlandı" : "Ayarlanmadı"}
            </Badge>
          }
          hint={
            hoursConfigured ? "Haftalık program oluşturuldu" : "Çalışma saatlerinizi ayarlayın"
          }
          href="/business/hours"
          iconTone="muted"
        />
        <StatCard
          icon={Link2}
          label="Yayın Linki"
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
            Hızlı İşlemler
          </p>
          <CardTitle className="text-lg">Sık kullanılan işlemler</CardTitle>
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
                <p className="text-sm font-medium">Hizmetleri Yönet</p>
                <p className="text-xs text-muted-foreground">
                  Hizmetleri ekle veya düzenle
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
                <p className="text-sm font-medium">Çalışma Saatleri</p>
                <p className="text-xs text-muted-foreground">
                  Haftalık programı ayarla
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
                <p className="text-sm font-medium">Medya Yükle</p>
                <p className="text-xs text-muted-foreground">
                  Fotoğraf ve portfolyo ekle
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
                <p className="text-sm font-medium">Randevular</p>
                <p className="text-xs text-muted-foreground">
                  Randevu taleplerini görüntüle
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
                <p className="text-sm font-medium">Randevu Linki Paylaş</p>
                <p className="text-xs text-muted-foreground">
                  QR kod, Instagram ve WhatsApp
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
                <p className="text-sm font-medium">Profili Görüntüle</p>
                <p className="text-xs text-muted-foreground">
                  Randevu sayfanı gör
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
