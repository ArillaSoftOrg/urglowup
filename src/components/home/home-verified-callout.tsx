import { Badge } from "@/components/ui/badge";
import { ShieldCheck, BadgeCheck, Star } from "lucide-react";

const trustPoints = [
  {
    icon: ShieldCheck,
    text: "Sadece tamamlanan randevular değerlendirilebilir",
  },
  {
    icon: BadgeCheck,
    text: "Her yorum ekibimiz tarafından incelenir",
  },
  {
    icon: Star,
    text: "Ortalama puan; gerçek, doğrulanmış randevulara dayanır",
  },
] as const;

export function HomeVerifiedCallout() {
  return (
    <section className="bg-surface-pink px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          <div className="flex-1">
            <Badge variant="pink" className="mb-4">
              Doğrulanmış Yorumlar
            </Badge>

            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              Her yorum gerçek bir deneyimden gelir.
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              UrGlowUp&apos;ta yorum bırakabilmek için o işletmede tamamlanmış
              bir randevun olması gerekir. Sahte veya teşvik edilmiş yorum
              yoktur — sadece gerçek müşteri deneyimleri.
            </p>

            <ul className="mt-6 space-y-3">
              {trustPoints.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-brand-pink-foreground"
                    strokeWidth={1.75}
                  />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-background p-6 shadow-sm md:w-56">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-pink/15">
              <ShieldCheck
                className="size-7 text-brand-pink-foreground"
                strokeWidth={1.5}
              />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-[-0.02em]">%100</p>
            <p className="mt-1 text-center text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Doğrulanmış
              <br />
              Değerlendirme
            </p>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Her değerlendirme, gerçek
              <br />
              bir randevuya dayanır.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
