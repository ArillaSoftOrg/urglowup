import Link from "next/link";
import Image from "next/image";
import type { BusinessWithDetails } from "@/lib/queries/business";

interface TeamSectionProps {
  business: BusinessWithDetails;
  hrefPrefix?: string;
}

export function TeamSection({ business, hrefPrefix = "" }: TeamSectionProps) {
  const professionals = business.professionals;
  if (!professionals || professionals.length === 0) return null;

  return (
    <section id="team" className="scroll-mt-[106px] space-y-6 md:scroll-mt-[130px]">
      <h2 className="text-2xl font-bold tracking-normal">Takım</h2>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {professionals.map((pro) => (
          <Link
            key={pro.id}
            href={`${hrefPrefix}/b/${business.slug}/team/${pro.slug}`}
            className="group flex min-w-0 flex-col items-center text-center transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            <div className="relative mb-4">
              {pro.avatarUrl ? (
                <Image
                  src={pro.avatarUrl}
                  alt={pro.displayName}
                  width={128}
                  height={128}
                  className="size-28 rounded-full border border-border/40 object-cover transition-shadow duration-200 group-hover:shadow-md sm:size-32"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full border border-border/40 bg-surface-purple text-3xl font-bold text-brand-purple-foreground transition-shadow duration-200 group-hover:shadow-md sm:size-32">
                  {pro.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="w-full min-w-0 space-y-1">
              <p className="truncate text-base font-semibold text-foreground">
                {pro.displayName}
              </p>
              {pro.title && (
                <p className="truncate text-sm text-muted-foreground">{pro.title}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
