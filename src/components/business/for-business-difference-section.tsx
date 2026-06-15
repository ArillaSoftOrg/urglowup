"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const beliefs = [
  {
    number: "1",
    title: "Çirkin ve karmaşık yazılıma gerek yok",
    body: [
      "UrGlowUp'u salon ekiplerinin gün içinde düşünmeden kullanabileceği kadar sade, hızlı ve anlaşılır tasarlıyoruz.",
      "Renkli takvimden müşteri geçmişine, mesajlardan randevu akışına kadar her ayrıntı gözü yormadan karar almanıza yardımcı olur.",
    ],
    image: "/business/panel-appointments.png",
    alt: "UrGlowUp işletme takvimi ve randevu yönetimi ekranı",
  },
  {
    number: "2",
    title: "Hızlı ve güvenilir çalışır",
    body: [
      "Yoğun saatlerde bekleten, dönen veya ekibi aynı ekranda kilitleyen bir sistem işletmeye pahalıya patlar.",
      "UrGlowUp temel akışlarını hız için kurar: randevuya bak, müşteriye ulaş, notu gör, işlemi tamamla.",
    ],
    image: "/business/panel-appointments.png",
    alt: "UrGlowUp hızlı randevu akışı paneli",
  },
  {
    number: "3",
    title: "Maliyeti azaltmak gerçek bir hedef",
    body: [
      "Daha az arama, daha az kayıp mesaj ve daha az tekrar iş, günün sonunda doğrudan maliyet azaltır.",
      "Müşteri bilgileri, rezervasyonlar ve ekip takibi tek yerde olduğunda işletme aynı işi daha az dağınıklıkla yürütür.",
    ],
    image: "/business/panel-messages.png",
    alt: "UrGlowUp müşteri mesajları ve takip paneli",
  },
  {
    number: "4",
    title: "Daha fazla kâr için tasarlandı",
    body: [
      "Boş saatleri görmek, tekrar gelen müşterileri takip etmek ve doğru zamanda hatırlatma yapmak büyümeyi şansa bırakmaz.",
      "UrGlowUp, sadece kayıt tutan bir panel değil; işletmenin kapasitesini ve gelir fırsatlarını daha net gösteren bir çalışma alanı sunar.",
    ],
    image: "/business/panel-appointments.png",
    alt: "UrGlowUp gelir ve kapasite odaklı randevu paneli",
  },
  {
    number: "5",
    title: "Her yerden tam kontrol",
    body: [
      "Salon dışındayken bile takvim, mesajlar, müşteri detayları ve ekip akışlarına ulaşmak gerekir.",
      "UrGlowUp her cihazda rahat kullanılacak şekilde düşünülür, böylece kontrol sadece resepsiyon bilgisayarında kalmaz.",
    ],
    image: "/business/panel-messages.png",
    alt: "UrGlowUp mobil ve masaüstü işletme kontrol paneli",
  },
] as const;

export function ForBusinessDifferenceSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = beliefs[activeIndex];

  return (
    <section
      id="why-different"
      className="scroll-mt-24 bg-[linear-gradient(180deg,oklch(0.99_0.006_325),oklch(0.97_0.018_300)_45%,oklch(0.995_0.004_300))] px-4 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-normal text-slate-950 md:text-6xl">
            UrGlowUp&apos;u özel yapan ne?
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-800 md:pt-3">
            Salon ve spa yazılımlarının çoğu ekiplerin hızını keser. Bizim
            temel inancımız daha temiz, daha anlaşılır ve daha kârlı bir
            işletme deneyimi oluşturmak.
          </p>
        </div>

        <div
          id="why-different-panel"
          className="mt-14 overflow-hidden rounded-[28px] border border-violet-100 bg-white/78 shadow-[0_24px_80px_oklch(0.25_0.05_300/0.10)]"
        >
          <div className="grid gap-10 p-6 md:grid-cols-[0.9fr_1fr] md:p-12">
            <div>
              <div className="flex items-center gap-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.84_0.10_265),oklch(0.87_0.12_330))] text-sm font-extrabold text-slate-950">
                  {active.number}
                </span>
                <h3 className="text-2xl font-extrabold tracking-normal text-slate-950 md:text-3xl">
                  {active.title}
                </h3>
              </div>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-800">
                {active.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-[oklch(0.975_0.01_20)] p-5">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <Image
                  key={active.image + active.number}
                  src={active.image}
                  alt={active.alt}
                  width={1600}
                  height={900}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-violet-100">
          {beliefs.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={item.number}
                type="button"
                aria-expanded={isActive}
                aria-controls="why-different-panel"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-6 px-2 py-6 text-left transition-colors md:px-12",
                  isActive ? "text-fuchsia-800" : "text-slate-950 hover:text-fuchsia-800"
                )}
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold shadow-sm",
                      isActive
                        ? "bg-fuchsia-100 text-fuchsia-800"
                        : "bg-white text-slate-950"
                    )}
                  >
                    {item.number}
                  </span>
                  <span className="text-lg font-extrabold md:text-xl">
                    {item.title}
                  </span>
                </span>
                {isActive ? (
                  <Minus aria-hidden="true" className="h-5 w-5 shrink-0" />
                ) : (
                  <Plus aria-hidden="true" className="h-5 w-5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
