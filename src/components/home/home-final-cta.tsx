import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function HomeFinalCTA({
  registerHref = "/business/register",
}: {
  registerHref?: string;
}) {
  return (
    <section className="bg-business-nav px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="mx-auto max-w-6xl text-5xl font-medium leading-[0.96] tracking-[-0.025em] text-business-nav-fg md:text-7xl lg:text-8xl">
          İşletmenizi yönetmeyi bırakın. Bunu yapacak bir sistem edinin.
        </h2>
        <div className="mt-11 flex flex-col items-center gap-5">
          <Link
            href={registerHref}
            className={cn(
              buttonVariants({ variant: "brand" }),
              "h-14 min-w-72 rounded-full px-8 text-base font-bold shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            )}
          >
            Ücretsiz olarak başlayın
          </Link>
          <p className="text-sm font-semibold text-business-nav-fg/70">
            Kredi kartı gerekmiyor.
          </p>
        </div>
      </div>
    </section>
  );
}
