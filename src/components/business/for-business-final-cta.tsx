import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ForBusinessFinalCTAProps {
  registerHref: string;
}

export function ForBusinessFinalCTA({
  registerHref,
}: ForBusinessFinalCTAProps) {
  return (
    <section className="overflow-hidden px-0 py-0">
      <div className="relative isolate flex min-h-[360px] items-center justify-center bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.28),transparent_28%),linear-gradient(115deg,#b43cf3_0%,#8758ff_42%,#7a00f5_100%)] px-4 py-20 text-center text-white md:min-h-[430px] md:py-28">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.12),transparent_24%,rgba(255,255,255,0.08)_58%,transparent)]" />
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold leading-tight tracking-normal md:text-6xl">
            Daha fazla müşteri için neyi bekliyorsun?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-white/90 md:text-2xl">
            UrGlowUp&apos;a katıl ve işletmeni bugün büyütmeye başla.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href={registerHref}
              className="inline-flex min-h-14 items-center gap-4 rounded-full bg-white px-8 text-base font-bold text-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-700 md:px-10 md:text-lg"
            >
              Hemen başlayın
              <ArrowRight className="size-6" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
