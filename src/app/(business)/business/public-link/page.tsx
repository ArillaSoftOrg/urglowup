import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ExternalLink, Link2 } from "lucide-react";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CopyButton } from "@/components/business/copy-button";
import { ProfileCompletionCard } from "@/components/business/profile-completion-card";
import { QRCodeCard } from "@/components/business/qr-code-card";
import {
  InstagramBioText,
  WhatsAppShareText,
} from "@/components/business/sharing-texts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/auth";
import { getAppUrl } from "@/lib/get-app-url";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getBusinessForPublicLink } from "@/lib/queries/business";
import { cn } from "@/lib/utils";

export const metadata = { title: "Rezervasyon Bağlantısı" };

export default async function PublicLinkPage() {
  const { businessId } = await requireBusiness();

  const business = await getBusinessForPublicLink(businessId);
  if (!business) {
    notFound();
  }

  const publicUrl = getAppUrl(`/b/${business.slug}`);
  const completion = calculateProfileCompletion(business);
  const isVisible =
    business.status === "ACTIVE_PRIVATE" ||
    business.status === "ACTIVE_MARKETPLACE";

  return (
    <div className="space-y-8">
      <BusinessPageHeader
        title="Rezervasyon Sayfanızı Paylaşın"
        description="Müşterilerinizle bağlantınızı paylaşın; randevu alabilsin ve hizmetlerinizi görebilsinler."
      />

      {!isVisible && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/15 p-4 text-sm text-warning-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Profiliniz herkese açık değil</p>
            <p className="mt-0.5 opacity-80">
              Hesabınızın durumu <strong>{business.status}</strong>. Rezervasyon sayfanızı
              müşterilere açmak için profil kurulumunuzu tamamlayın.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-surface-cream">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Rezervasyon Bağlantınız
          </CardTitle>
          <CardDescription>
            Bu bağlantıyı sosyal medyada, mesajlarda veya müşterilerin sizi bulabileceği her yerde paylaşın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-medium">{publicUrl}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={publicUrl} label="Bağlantıyı Kopyala" />
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="size-4" />
              Profili Gör
            </Link>
          </div>
        </CardContent>
      </Card>

      <QRCodeCard publicUrl={publicUrl} businessSlug={business.slug} />

      <div className="grid gap-6 sm:grid-cols-2">
        <InstagramBioText publicUrl={publicUrl} />
        <WhatsAppShareText publicUrl={publicUrl} />
      </div>

      <ProfileCompletionCard completion={completion} />
    </div>
  );
}
