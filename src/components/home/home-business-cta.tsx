import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function HomeBusinessCTA() {
  return (
    <section className="bg-foreground px-4 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              İşletmenizi Büyütün
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.015em] text-white md:text-3xl">
              Güzellik uzmanı mısınız?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 md:text-base">
              Ücretsiz profilinizi oluşturun, çalışmalarınızı sergileyin ve
              yeni müşterilere randevu kapısı açın. Kurulum birkaç dakika sürer.
            </p>
            <p className="mt-3 text-sm font-medium text-white/45">
              Kredi kartı gerekmez.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-3 md:items-start">
            <Link
              href="/business/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full bg-white px-8 text-foreground hover:bg-white/90 md:w-auto"
              )}
            >
              Ücretsiz Kayıt Olun
            </Link>
            <Link
              href="/for-business"
              className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              Nasıl çalışır →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
