import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "İşletmeni Kaydet" };

const benefits = [
  "Profesyonel işletme profilini oluştur",
  "Hizmetlerini, fotoğraflarını ve çalışmalarını sergile",
  "Müşterilerden randevu taleplerini tek yerden al",
  "Çalışma saatlerini ve iletişim bilgilerini yönet",
  "Doğrulanmış yorumlarla güven oluştur",
];

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">İşletmeni UrGlowUp&apos;a Kaydet</CardTitle>
          <CardDescription>
            Önce işletmeni tanıtalım. Hesap bilgilerini profilini oluştururken
            güvenli erişim için alacağız.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/register?redirect_url=/business/onboarding"
            className="block"
          >
            <Button className="w-full" size="lg">
              Kaydol ve işletmeni oluştur
            </Button>
          </Link>

          <p className="text-center text-xs text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link
              href="/login?redirect_url=/business/onboarding"
              className="font-medium text-primary hover:underline"
            >
              Giriş yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
