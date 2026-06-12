import Link from "next/link";

export function HomeMigrationTransfer({
  registerHref = "/business/register",
}: {
  registerHref?: string;
}) {
  return (
    <section className="bg-[oklch(0.975_0.009_190)] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Zahmetsiz geçiş
        </p>
        <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.025em] text-slate-950 md:text-6xl lg:text-7xl">
          Geçiş işlemlerini biz halledelim. Sizin için ücretsiz.
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-8 text-slate-700 md:text-xl">
          Randevular, müşteri kayıtları, hizmetler ve ekip takvimi. Dağınık
          bilgilerinizi UrGlowUp&apos;a düzenli şekilde taşıyıp sizi kaldığınız
          yerden başlatırız.
        </p>
        <Link
          href={registerHref}
          className="mt-10 inline-flex h-14 min-w-72 items-center justify-center rounded-full border border-slate-950/80 px-7 text-base font-semibold text-slate-950 transition-colors duration-200 hover:bg-slate-950 hover:text-[oklch(0.975_0.009_190)]"
        >
          Ücretsiz veri transferinizi alın
        </Link>
      </div>
    </section>
  );
}
