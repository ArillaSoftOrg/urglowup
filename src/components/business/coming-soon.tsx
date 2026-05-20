import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface ComingSoonProps {
  headline: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

export function ComingSoon({
  headline,
  description,
  icon = Sparkles,
  primaryAction,
  secondaryAction,
}: ComingSoonProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <EmptyState
        icon={icon}
        headline={headline}
        description={description}
        surface="cream"
        action={
          primaryAction
            ? {
                label: primaryAction.label,
                href: primaryAction.href,
                variant: "brand",
              }
            : undefined
        }
        secondaryAction={secondaryAction}
      />
    </div>
  );
}
