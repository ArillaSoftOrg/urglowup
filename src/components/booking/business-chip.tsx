import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { BookingBusiness } from "@/lib/queries/appointments";

export function BusinessChip({ business }: { business: BookingBusiness }) {
  return (
    <Link
      href={`/b/${business.slug}`}
      className="flex items-center gap-3 rounded-xl bg-surface-cream px-3 py-2.5 transition-colors hover:bg-surface-pink"
    >
      {business.logoUrl ? (
        <img
          src={business.logoUrl}
          alt={business.name}
          className="size-10 shrink-0 rounded-lg object-cover sm:size-12"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-pink/20 sm:size-12">
          <Sparkles className="size-5 text-brand-pink-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Randevu</p>
        <p className="truncate text-sm font-semibold sm:text-base">
          {business.name}
        </p>
      </div>
    </Link>
  );
}
