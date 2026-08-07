import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingHeaderProps {
  businessName: string;
  businessSlug: string;
  currentStep: number;
  totalSteps: number;
}

export function BookingHeader({
  businessName,
  businessSlug,
  currentStep,
  totalSteps,
}: BookingHeaderProps) {
  return (
    <div className="space-y-2">
      <Link
        href={`/b/${businessSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {businessName}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
          Randevu Talep Et
        </h1>
        <Badge variant="neutral">
          Adım {currentStep} / {totalSteps}
        </Badge>
      </div>
    </div>
  );
}
