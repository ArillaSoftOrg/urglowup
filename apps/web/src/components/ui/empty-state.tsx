import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

interface EmptyStateProps {
  icon?: React.ElementType;
  headline: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: { label: string; href: string };
  surface?: "default" | "pink" | "cream";
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  headline,
  description,
  action,
  secondaryAction,
  surface = "default",
  compact = false,
}: EmptyStateProps) {
  const surfaceClass = {
    default: "bg-card",
    pink: "bg-surface-pink",
    cream: "bg-surface-cream",
  }[surface];

  const actionSize = compact ? "sm" : "default";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl text-center",
        compact ? "px-6 py-10" : "px-8 py-16 md:py-20",
        surfaceClass
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            compact
              ? "mb-4 size-12 bg-muted"
              : "mb-6 size-16 bg-brand-pink/20"
          )}
        >
          <Icon
            className={cn(
              "text-brand-pink-foreground",
              compact ? "size-5" : "size-7"
            )}
            strokeWidth={1.5}
          />
        </div>
      )}

      <h3
        className={cn(
          "font-semibold tracking-[-0.01em] text-foreground",
          compact ? "text-sm" : "text-lg"
        )}
      >
        {headline}
      </h3>

      {description && (
        <p
          className={cn(
            "mx-auto mt-2 max-w-xs leading-relaxed text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-3",
            compact ? "mt-4" : "mt-6"
          )}
        >
          {action &&
            (action.href ? (
              <Link
                href={action.href}
                className={buttonVariants({
                  variant: action.variant ?? "default",
                  size: actionSize,
                })}
              >
                {action.label}
              </Link>
            ) : (
              <Button
                variant={action.variant ?? "default"}
                size={actionSize}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
