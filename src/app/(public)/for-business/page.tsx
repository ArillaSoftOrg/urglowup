import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  Camera,
  Globe,
  Star,
  Users,
  Zap,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ForBusinessDifferenceSection } from "@/components/business/for-business-difference-section";
import { ForBusinessFinalCTA } from "@/components/business/for-business-final-cta";
import { ForBusinessHero } from "@/components/business/for-business-hero";
import { ForBusinessSuitableSection } from "@/components/business/for-business-suitable-section";
import { HomeFAQ } from "@/components/home/home-faq";
import { HomeMigrationTransfer } from "@/components/home/home-migration-transfer";
import { buildAlternates } from "@/lib/i18n-metadata";
import { cn } from "@/lib/utils";

const description =
  "Güzellik ve kişisel bakım işletmeni UrGlowUp'ta yayınla; portfolyonu, hizmetlerini ve yorumlarını göstererek yeni müşterilerden randevu talepleri al.";

export const metadata: Metadata = {
  title: "İşletmeler İçin",
  description,
  openGraph: {
    title: "İşletmeler İçin | UrGlowUp",
    description,
    url: "/for-business",
    locale: "tr_TR",
  },
  alternates: buildAlternates("/for-business", "tr"),
};

const features = [
  {
    icon: Globe,
    title: "Profesyonel Profil",
    description:
      "İşletmeni, hizmetlerini ve portfolyonu gösterebileceğin şık bir public sayfaya sahip ol.",
  },
  {
    icon: CalendarCheck,
    title: "Randevu Talepleri",
    description:
      "Müşteriler profilinden doğrudan randevu talebi göndersin; kontrol her zaman sende kalsın.",
  },
  {
    icon: Camera,
    title: "Portfolyo Galerisi",
    description:
      "Yaptığın işleri fotoğraf ve videolarla sergileyerek yeni müşterilerin ilgisini çek.",
  },
  {
    icon: Star,
    title: "Doğrulanmış Yorumlar",
    description:
      "Randevusunu tamamlayan müşterilerden gelen doğrulanmış yorumlarla güven oluştur.",
  },
  {
    icon: Users,
    title: "Müşteri Yönetimi",
    description:
      "Müşterilerini, randevularını ve tercihlerini düzenli biçimde takip et.",
  },
  {
    icon: Zap,
    title: "Kolay Kullanım",
    description:
      "Dakikalar içinde kurulum yap. Teknik bilgi gerekmez; her cihazda rahatça çalışır.",
  },
];

const steps = [
  {
    number: "1",
    title: "Hesabını oluştur",
    description: "Kayıt ol ve bize işletmenden bahset.",
  },
  {
    number: "2",
    title: "Profilini hazırla",
    description: "Hizmetlerini, çalışma saatlerini ve fotoğraflarını ekle.",
  },
  {
    number: "3",
    title: "Linkini paylaş",
    description:
      "Public sayfanı sosyal medyada paylaş ve randevu talepleri almaya başla.",
  },
];

export default function ForBusinessPage() {
  return (
    <div>
      <ForBusinessHero registerHref="/business/register" />
      <ForBusinessDifferenceSection />
      <ForBusinessSuitableSection />

      <section className="border-t bg-muted/30 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Başarılı olmak için ihtiyacın olan her şey
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            UrGlowUp, güzellik işletmeni yönetmek ve büyütmek için ihtiyaç
            duyduğun araçları sunar.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            3 kolay adımda başla
          </h2>
          <div className="mt-12 space-y-8">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/business/register"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Hemen Başla
            </Link>
          </div>
        </div>
      </section>

      <HomeMigrationTransfer />
      <HomeFAQ />
      <ForBusinessFinalCTA registerHref="/business/register" />
    </div>
  );
}
