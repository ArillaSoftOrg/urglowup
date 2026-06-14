import Image from "next/image";
import { Plus } from "lucide-react";

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
  },
  {
    number: "3",
    title: "Maliyeti azaltmak gerçek bir hedef",
  },
  {
    number: "4",
    title: "Daha fazla kâr için tasarlandı",
  },
  {
    number: "5",
    title: "Her yerden tam kontrol",
  },
] as const;

export function ForBusinessDifferenceSection() {
  const [featured, ...collapsed] = beliefs;

  return (
    <section className="bg-[linear-gradient(180deg,oklch(0.99_0.006_325),oklch(0.97_0.018_300)_45%,oklch(0.995_0.004_300))] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
          <h2 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-normal text-slate-950 md:text-6xl">
            UrGlowUp&apos;u özel yapan ne?
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-800 md:pt-3">
            Salon ve spa yazılımlarının çoğu ekiplerin hızını keser. Bizim temel
            inançlarımız daha temiz, daha anlaşılır ve daha kârlı bir işletme
            deneyimi oluşturmak için var.
          </p>
        </div>

        <div className="mt-14 overflow-hidden rounded-[28px] border border-violet-100 bg-white/78 shadow-[0_24px_80px_oklch(0.25_0.05_300/0.10)]">
          <div className="grid gap-10 p-6 md:grid-cols-[0.9fr_1fr] md:p-12">
            <div>
              <div className="flex items-center gap-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.84_0.10_265),oklch(0.87_0.12_330))] text-sm font-extrabold text-slate-950">
                  {featured.number}
                </span>
                <h3 className="text-2xl font-extrabold tracking-normal text-slate-950 md:text-3xl">
                  {featured.title}
                </h3>
              </div>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-800">
                {featured.body?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <a
                href="#how-it-works"
                className="mt-8 inline-flex h-12 items-center rounded-full border border-fuchsia-500 px-7 text-sm font-bold text-fuchsia-700 transition-colors hover:bg-fuchsia-50"
              >
                Devamını gör
              </a>
            </div>

            <div className="rounded-[28px] bg-[oklch(0.975_0.01_20)] p-5">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <Image
                  src={featured.image}
                  alt={featured.alt}
                  width={1600}
                  height={900}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-violet-100">
          {collapsed.map((item) => (
            <div
              key={item.number}
              className="flex items-center justify-between gap-6 px-2 py-6 md:px-12"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-extrabold text-slate-950 shadow-sm">
                  {item.number}
                </span>
                <h3 className="text-lg font-extrabold text-slate-950 md:text-xl">
                  {item.title}
                </h3>
              </div>
              <Plus aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-600" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
