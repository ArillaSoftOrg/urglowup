import Link from "next/link";

export function HomeMigrationTransfer({
  registerHref = "/business/register",
}: {
  registerHref?: string;
}) {
  return (
    <section className="bg-surface-cream px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Zahmetsiz geçiş
        </p>
        <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.025em] text-foreground md:text-6xl lg:text-7xl">
          Geçiş işlemlerini biz halledelim. Sizin için ücretsiz.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-8 text-muted-foreground md:text-xl">
          Randevular, müşteri kayıtları, hizmetler ve ekip takvimi. Dağınık
          bilgilerinizi UrGlowUp&apos;a düzenli şekilde taşıyıp sizi kaldığınız
          yerden başlatırız.
        </p>
        <Link
          href={registerHref}
          className="mt-10 inline-flex h-14 min-w-72 items-center justify-center rounded-full border border-foreground/80 px-7 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
        >
          Ücretsiz veri transferinizi alın
        </Link>
      </div>
    </section>
  );
}
