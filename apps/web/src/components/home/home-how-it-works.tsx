import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Search, UserRound, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Uzmanını keşfet",
    body: "Kategoriye, şehre veya isme göre ara. Gerçek çalışmaları ve doğrulanmış yorumları incele.",
  },
  {
    icon: UserRound,
    title: "Profili incele",
    body: "Hizmetleri, çalışma saatlerini ve müşteri deneyimlerini detaylıca gör. Sana en uygun uzmanı seç.",
  },
  {
    icon: CalendarCheck,
    title: "Randevunu al",
    body: "Birkaç tıklamayla randevu talebini ilet. Uzmanın onayladıktan sonra hazırsın.",
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="bg-surface-cream px-4 py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
            Randevu almak hiç bu kadar{" "}
            <br className="hidden md:block" />
            kolay olmamıştı.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col gap-4 rounded-2xl bg-background p-6 shadow-sm"
              >
                {/* Step number badge */}
                <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                  {i + 1}
                </span>

                {/* Icon */}
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-pink/15 text-brand-pink-foreground">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/explore"
            className={cn(buttonVariants({ variant: "brand", size: "lg" }), "px-8")}
          >
            Hemen Başla
          </Link>
        </div>
      </div>
    </section>
  );
}
