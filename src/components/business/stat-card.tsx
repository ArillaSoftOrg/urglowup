import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  surface?: "default" | "cream";
  iconTone?: "pink" | "warning" | "info" | "muted";
  size?: "default" | "sm" | "compact";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["iconTone"]>, string> = {
  pink: "bg-brand-pink/20 text-brand-pink-foreground",
  warning: "bg-warning/20 text-warning-foreground",
  info: "bg-info/20 text-info-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  surface = "default",
  iconTone = "pink",
  size = "default",
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "h-full border border-brand-purple/20 bg-card shadow-sm transition-colors",
        surface === "cream" && "bg-surface-cream",
        href && "hover:border-brand-purple/40 hover:bg-surface-purple"
      )}
    >
      <CardContent
        className={cn(
          "flex items-center gap-4",
          size === "compact" &&
            "gap-3 px-3 py-3 min-[360px]:flex-col min-[360px]:items-start min-[360px]:gap-2 sm:flex-row sm:items-center sm:gap-4 sm:py-4",
          size === "sm" ? "p-3" : size === "compact" ? "" : "p-6"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            size === "sm"
              ? "size-8"
              : size === "compact"
                ? "size-10 min-[360px]:size-11 sm:size-14"
                : "size-16",
            TONE_CLASSES[iconTone]
          )}
        >
          <Icon
            className={
              size === "sm"
                ? "size-4"
                : size === "compact"
                  ? "size-5 sm:size-6"
                  : "size-7"
            }
          />
        </div>
        <div className={cn("min-w-0", size === "sm" ? "space-y-0.5" : "space-y-1")}>
          <p className={cn(
            "truncate font-semibold text-brand-purple-foreground",
            size === "compact" ? "text-xs min-[360px]:text-[13px] sm:text-sm" : "text-sm"
          )}>{label}</p>
          <div
            className={cn(
              "font-bold tabular-nums",
              size === "sm"
                ? "text-xl"
                : size === "compact"
                  ? "text-xl min-[360px]:text-2xl sm:text-3xl"
                  : "text-3xl"
            )}
          >
            {value}
          </div>
          {hint && (
            <p className={cn(
              "truncate text-muted-foreground",
              size === "compact" ? "text-xs sm:text-sm" : "text-sm"
            )}>{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
