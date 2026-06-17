import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ExternalLink, Globe } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/get-app-url";
import { cn } from "@/lib/utils";

export const metadata = { title: "Ayarlar" };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_APPROVAL: "İnceleniyor",
  ACTIVE_PRIVATE: "Aktif (Özel)",
  ACTIVE_MARKETPLACE: "Vitrin",
  SUSPENDED: "Askıya Alındı",
  REJECTED: "Reddedildi",
};

const STATUS_VARIANTS: Record<
  string,
  "success" | "warning" | "destructive" | "neutral" | "secondary" | "info"
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  ACTIVE_PRIVATE: "info",
  ACTIVE_MARKETPLACE: "success",
  SUSPENDED: "destructive",
  REJECTED: "destructive",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  DRAFT: "Profiliniz taslak modunda ve müşterilere görünmüyor.",
  PENDING_APPROVAL: "Profiliniz UrGlowUp ekibi tarafından inceleniyor.",
  ACTIVE_PRIVATE:
    "Profiliniz rezervasyon bağlantınızda yayında; ancak henüz vitrine eklenmedi.",
  ACTIVE_MARKETPLACE: "Profiliniz yayında ve vitrinde görünür.",
  SUSPENDED:
    "Profiliniz askıya alındı. Daha fazla bilgi için destek ekibiyle iletişime geçin.",
  REJECTED:
    "Profiliniz onaylanmadı. Daha fazla bilgi için destek ekibiyle iletişime geçin.",
};

export default async function SettingsPage() {
  const { businessId } = await requireBusiness("OWNER");

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      name: true,
      slug: true,
      status: true,
      isMarketplaceVisible: true,
      createdAt: true,
    },
  });

  if (!business) {
    notFound();
  }

  const publicUrl = getAppUrl(`/b/${business.slug}`);

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Ayarlar"
        description="İşletme hesabı ayarlarınızı yönetin."
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4" />
                Profil Durumu
              </CardTitle>
              <CardDescription>
                Güncel profilinizin görünürlüğü ve vitrin durumu.
              </CardDescription>
            </div>
            <Badge variant={STATUS_VARIANTS[business.status] ?? "neutral"}>
              {STATUS_LABELS[business.status] ?? business.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-surface-cream p-4">
            <p className="text-sm text-muted-foreground">
              {STATUS_DESCRIPTIONS[business.status] ?? ""}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Vitrin Görünürlüğü
                </p>
                <p className="mt-0.5 font-medium">
                  {business.isMarketplaceVisible ? "Görünür" : "Listelenmedi"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Üyelik Tarihi
                </p>
                <p className="mt-0.5 font-medium">
                  {new Date(business.createdAt).toLocaleDateString("tr-TR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Profil durumunuzu değiştirmek için{" "}
            <a href="mailto:support@urglowup.com" className="underline underline-offset-2">
              support@urglowup.com
            </a>{" "}
            ile iletişime geçin.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rezervasyon Bağlantısı</CardTitle>
          <CardDescription>
            Müşterilerinizle paylaştığınız benzersiz rezervasyon bağlantınız.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface-cream px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-medium text-muted-foreground">
              /b/
            </span>
            <span className="text-sm font-semibold">{business.slug}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="size-3.5" />
              Profili Gör
            </Link>
            <Link
              href="/business/public-link"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Paylaşım Seçenekleri
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            URL değişikliği için{" "}
            <a href="mailto:support@urglowup.com" className="underline underline-offset-2">
              support@urglowup.com
            </a>{" "}
            ile iletişime geçin.
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            Tehlikeli Bölge
          </CardTitle>
          <CardDescription>
            Hesabınızı kalıcı olarak etkileyen geri alınamaz işlemler.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">İşletmeyi Sil</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                İşletme profilinizi, hizmetlerinizi, medyalarınızı ve tüm verilerinizi kalıcı
                olarak silin.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
              <Button
                variant="destructive"
                size="sm"
                disabled
                title="Hesabınızı silmek için destek ekibiyle iletişime geçin."
              >
                İşletmeyi Sil
              </Button>
              <a
                href="mailto:support@urglowup.com"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Destek ile İletişime Geç
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
