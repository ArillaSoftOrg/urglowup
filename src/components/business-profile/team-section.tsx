import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { BusinessWithDetails } from "@/lib/queries/business";

interface TeamSectionProps {
  business: BusinessWithDetails;
  hrefPrefix?: string;
}

export function TeamSection({ business, hrefPrefix = "" }: TeamSectionProps) {
  const professionals = business.professionals;
  if (!professionals || professionals.length === 0) return null;

  return (
    <section id="team" className="space-y-4">
      <h2 className="text-xl font-bold tracking-normal">Ekip</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((pro) => (
          <Link
            key={pro.id}
            href={`${hrefPrefix}/b/${business.slug}/team/${pro.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:border-border hover:bg-muted/30"
          >
            {pro.avatarUrl ? (
              <Image
                src={pro.avatarUrl}
                alt={pro.displayName}
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-purple text-lg font-bold text-brand-purple-foreground">
                {pro.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{pro.displayName}</p>
              {pro.title && (
                <p className="truncate text-xs text-muted-foreground">{pro.title}</p>
              )}
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
