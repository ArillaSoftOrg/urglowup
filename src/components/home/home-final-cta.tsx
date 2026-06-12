import Link from "next/link";

export function HomeFinalCTA({
  registerHref = "/business/register",
}: {
  registerHref?: string;
}) {
  return (
    <section className="bg-[oklch(0.82_0.145_115)] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mx-auto max-w-6xl text-5xl font-medium leading-[0.96] tracking-[-0.025em] text-slate-950 md:text-7xl lg:text-8xl">
          İşletmenizi yönetmeyi bırakın. Bunu yapacak bir sistem edinin.
        </h2>
        <div className="mt-11 flex flex-col items-center gap-5">
          <Link
            href={registerHref}
            className="inline-flex h-14 min-w-72 items-center justify-center rounded-full bg-slate-950 px-8 text-base font-bold text-[oklch(0.96_0.012_110)] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-900"
          >
            Ücretsiz olarak başlayın
          </Link>
          <p className="text-sm font-semibold text-slate-700">
            Kredi kartı gerekmiyor.
          </p>
        </div>
      </div>
    </section>
  );
}
