import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { buildAuthRedirectQuery } from "@/lib/auth-redirect";
import { db } from "@/lib/db";
import { hashInvitationToken } from "@/lib/invitation-token";
import { cn } from "@/lib/utils";
import { acceptInvitation } from "./actions";

export const metadata = { title: "İşletme Daveti" };

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Sahip",
  MANAGER: "Yönetici",
  STAFF: "Personel",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

function InviteCard({
  description,
  children,
}: {
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12">
      <Card className="w-full border-border/70 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">UrGlowUp</CardTitle>
          <CardDescription>
            <span className="block text-base font-semibold text-foreground">
              İşletme Daveti
            </span>
            {description && <span className="mt-1 block">{description}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}

export default async function BusinessInvitePage({ params }: PageProps) {
  const { token } = await params;
  const tokenHash = hashInvitationToken(token);

  const invitation = await db.businessInvitation.findUnique({
    where: { tokenHash },
    include: { business: { select: { name: true } } },
  });

  const isExpired = invitation ? invitation.expiresAt < new Date() : false;

  if (!invitation || invitation.acceptedAt !== null || isExpired) {
    return (
      <InviteCard>
        <AuthFormFeedback
          tone="error"
          message="Bu davet bağlantısı geçersiz, süresi dolmuş veya zaten kullanılmış."
        />
        <Link href="/" className={cn(buttonVariants(), "w-full")}>
          Ana sayfaya dön
        </Link>
      </InviteCard>
    );
  }

  const roleLabel = ROLE_LABELS[invitation.role] ?? invitation.role;
  const user = await getCurrentUser();

  if (!user) {
    const redirectQuery = buildAuthRedirectQuery(`/business/invite/${token}`);
    return (
      <InviteCard
        description={`${invitation.business.name} işletmesine ${roleLabel} olarak davet edildiniz.`}
      >
        <p className="text-sm text-muted-foreground">
          Devam etmek için <strong>{invitation.email}</strong> adresiyle giriş
          yapın ya da yeni bir hesap oluşturun.
        </p>
        <Link
          href={`/register${redirectQuery}`}
          className={cn(buttonVariants(), "w-full")}
        >
          Hesap Oluştur
        </Link>
        <Link
          href={`/login${redirectQuery}`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Giriş Yap
        </Link>
      </InviteCard>
    );
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <InviteCard>
        <AuthFormFeedback
          tone="error"
          message={`Bu davet ${invitation.email} adresine gönderildi. Lütfen bu adresle ilişkili hesapla giriş yapın.`}
        />
        <form action={signOutAction}>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Çıkış Yap
          </button>
        </form>
      </InviteCard>
    );
  }

  return (
    <InviteCard
      description={`${invitation.business.name} işletmesine ${roleLabel} olarak davet edildiniz.`}
    >
      <p className="text-sm text-muted-foreground">
        Daveti kabul ederek bu işletmenin ekibine katılacaksınız.
      </p>
      <form action={acceptInvitation.bind(null, token)}>
        <button type="submit" className={cn(buttonVariants(), "w-full")}>
          Daveti Kabul Et
        </button>
      </form>
    </InviteCard>
  );
}
