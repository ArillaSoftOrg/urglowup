import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Camera,
  Globe,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { HomeMigrationTransfer } from "@/components/home/home-migration-transfer";
import { HomeFinalCTA } from "@/components/home/home-final-cta";
import { HomeFAQ } from "@/components/home/home-faq";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const alternates = buildAlternates("/for-business", locale);
  const description =
    "Güzellik ve kişisel bakım işletmeni UrGlowUp'ta yayınla; portfolyonu, hizmetlerini ve yorumlarını göstererek yeni müşterilerden randevu talepleri al.";

  return {
    title: "İşletmeler İçin",
    description,
    openGraph: {
      title: "İşletmeler İçin | UrGlowUp",
      description,
      url: `/${locale}/for-business`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

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

export default async function LocaleForBusinessPage({ params }: PageProps) {
  const { locale } = await params;
  const registerHref = `/${locale}/business/register`;

  return (
    <div>
      {/* Hero */}
      <section className="px-4 py-20 text-center md:py-32">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Güzellik İşletmeni Online Büyüt
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Profesyonel profilini oluştur, yaptığın işleri sergile ve müşterilerden
          randevu taleplerini tek yerden al.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/business/register"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            İşletmeni Kaydet
          </Link>
          <a
            href="#how-it-works"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Nasıl Çalışır?
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Başlamak ücretsiz. Kredi kartı gerekmez.
        </p>
      </section>

      {/* Features */}
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

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            3 kolay adımda başla
          </h2>
          <div className="mt-12 space-y-8">
            {steps.map((s) => (
              <div key={s.number} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.number}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-muted-foreground">{s.description}</p>
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

      <HomeMigrationTransfer registerHref={registerHref} />
      <HomeFinalCTA registerHref={registerHref} />
      <HomeFAQ />
    </div>
  );
}
