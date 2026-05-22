import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BadgeCheck,
  BarChart2,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { PuanlamaFaq } from "./puanlama-faq";

export const metadata: Metadata = {
  title: { absolute: "Puanlama Sistemi | UrGlowUp" },
  description:
    "UrGlowUp yorum ve puanlama sisteminin nasıl çalıştığını; doğrulanmış yorumları, 0–10 puanlamayı, güncellik etkisini ve adil işletme skorlarını keşfedin.",
  openGraph: {
    title: "Puanlama Sistemi | UrGlowUp",
    description:
      "UrGlowUp yorum ve puanlama sisteminin nasıl çalıştığını; doğrulanmış yorumları, 0–10 puanlamayı, güncellik etkisini ve adil işletme skorlarını keşfedin.",
    url: "/puanlama-sistemi",
  },
  alternates: { canonical: "/puanlama-sistemi" },
};

const customerCards = [
  {
    icon: BadgeCheck,
    title: "Doğrulanmış yorumlar",
    description:
      "Yalnızca gerçek randevu deneyimlerinden gelen değerlendirmeler öne çıkarılır.",
  },
  {
    icon: SlidersHorizontal,
    title: "0–10 hassas puanlama",
    description:
      "Klasik yıldız sistemi yerine, deneyiminizi daha hassas ifade eden kaydırmalı puanlama kullanılır.",
  },
  {
    icon: Clock,
    title: "Güncel kalite takibi",
    description:
      "Yeni yorumlar daha güçlü etki eder. Böylece işletmenin son dönemdeki performansı daha doğru görünür.",
  },
] as const;

const businessCards = [
  {
    icon: BarChart2,
    title: "Az yorumla yapay yükselme engellenir",
    description:
      "Yeni işletmeler birkaç yüksek puanla doğrudan zirveye çıkmaz; sistem güven eşiğini dikkate alır.",
  },
  {
    icon: TrendingUp,
    title: "Eski yorumlar sonsuza kadar aynı etkiyi taşımaz",
    description:
      "Yıllar önceki değerlendirmeler tamamen silinmez, ancak güncel performansa göre daha düşük ağırlıkla hesaba katılır.",
  },
  {
    icon: ShieldCheck,
    title: "Sahte ve düşük güvenli yorumlara karşı koruma",
    description:
      "Randevu doğrulaması, güven ağırlığı ve şüpheli davranış sinyalleri puan sistemine dahil edilir.",
  },
] as const;

const howItWorksItems = [
  {
    number: "01",
    title: "Verilen Puan",
    description:
      "Müşteri, randevu sonrasında 0–10 arasında bir puan verir. Bu değer hesaplamanın temelini oluşturur.",
  },
  {
    number: "02",
    title: "Güncellik Etkisi",
    description:
      "Son dönemdeki yorumlar daha fazla ağırlık taşır. Eski değerlendirmeler silinmez; yalnızca etkisi zaman içinde kademeli olarak azalır.",
  },
  {
    number: "03",
    title: "Güven Ağırlığı",
    description:
      "Tamamlanan randevuya bağlı ve güvenilirlik sinyalleri yüksek yorumlar, nihai puanı çok daha güçlü biçimde etkiler.",
  },
  {
    number: "04",
    title: "Güven Eşiği Dengesi",
    description:
      "Az yorumu olan işletmeler için puan, platform ortalamasıyla dengelenir. Daha fazla gerçek randevu deneyimi geldikçe bu denge kalkar ve puan kendi performansını güçlü biçimde yansıtır.",
  },
] as const;

export default function PuanlamaSistemiPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-background px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="pink" className="mb-4">
            Puanlama Sistemi
          </Badge>
          <h1 className="text-3xl font-bold leading-[1.1] tracking-[-0.02em] md:text-5xl">
            Puanlar yalnızca sayı değildir,{" "}
            <span className="text-brand-pink-foreground">
              gerçek deneyimlerden oluşur.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            UrGlowUp&apos;ta yorumlar tamamlanmış randevulara dayanır. Puanlar;
            güncellik, doğrulanmış deneyim ve güvenilirlik sinyalleri dikkate
            alınarak hesaplanır.
          </p>
        </div>
      </section>

      {/* Customer section */}
      <section className="bg-surface-pink px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <Badge variant="pink" className="mb-3">
              Kullanıcılar İçin
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              Kullanıcılar için daha güvenilir kararlar
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {customerCards.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-pink/20">
                    <Icon
                      className="size-5 text-brand-pink-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business section */}
      <section className="bg-surface-purple px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <Badge variant="purple" className="mb-3">
              İşletmeler İçin
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              İşletmeler için daha adil görünürlük
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {businessCards.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-purple/20">
                    <Icon
                      className="size-5 text-brand-purple-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-cream px-4 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">
              Hesaplama
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              Sistem nasıl hesaplar?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Dört temel faktör birlikte değerlendirilerek her işletme için
              güvenilir bir puan oluşturulur.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {howItWorksItems.map(({ number, title, description }) => (
              <div key={number} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-pink/15 text-sm font-bold tabular-nums text-brand-pink-foreground">
                  {number}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not simple average */}
      <section className="bg-background px-4 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-3">
            Neden Farklı?
          </Badge>
          <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
            Neden basit ortalama kullanılmıyor?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Klasik ortalamada 2 yorumu olan bir işletme ile 500 yorumu olan bir
            işletme aynı şekilde değerlendirilebilir. UrGlowUp bunu daha adil
            hale getirir. Yeni sistem, az sayıda yorumla oluşan aşırı yüksek
            veya aşırı düşük puanları dengeler. İşletme daha fazla gerçek
            deneyim aldıkça puanı kendi performansını daha güçlü yansıtır.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-pink px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Badge variant="pink" className="mb-3">
              Sık Sorulan Sorular
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              Merak edilenler
            </h2>
          </div>
          <div className="rounded-xl border border-border/60 bg-background px-5 shadow-sm">
            <PuanlamaFaq />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.015em] text-white md:text-3xl">
            Gerçek deneyimlere dayalı karar verin.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Doğrulanmış yorumları olan işletmeleri keşfedin ya da kendi
            işletmenizi platforma ekleyin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-white px-8 text-foreground hover:bg-white/90"
              )}
            >
              İşletmeleri keşfet
            </Link>
            <Link
              href="/for-business"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/20 px-8 text-white hover:bg-white/10 hover:text-white"
              )}
            >
              İşletmeni ekle
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
