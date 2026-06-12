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
  pink: "bg-[oklch(0.94_0.045_345)] text-[oklch(0.45_0.16_345)]",
  warning: "bg-[oklch(0.93_0.055_75)] text-[oklch(0.43_0.12_65)]",
  info: "bg-[oklch(0.93_0.05_235)] text-[oklch(0.42_0.13_240)]",
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
        "h-full border border-[oklch(0.91_0.015_285)] bg-card shadow-sm transition-colors",
        surface === "cream" && "bg-surface-cream",
        href && "hover:border-[oklch(0.82_0.045_285)] hover:bg-[oklch(0.995_0.006_285)]"
      )}
    >
      <CardContent
        className={cn(
          "flex items-center gap-4",
          size === "compact" && "flex-col items-start gap-2 px-3 py-4 sm:flex-row sm:items-center sm:gap-4",
          size === "sm" ? "p-3" : size === "compact" ? "" : "p-6"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            size === "sm" ? "size-8" : size === "compact" ? "size-11 sm:size-14" : "size-16",
            TONE_CLASSES[iconTone]
          )}
        >
          <Icon className={size === "sm" ? "size-4" : size === "compact" ? "size-5 sm:size-6" : "size-7"} />
        </div>
        <div className={cn("min-w-0", size === "sm" ? "space-y-0.5" : "space-y-1")}>
          <p className={cn(
            "truncate font-semibold text-[oklch(0.24_0.055_285)]",
            size === "compact" ? "text-[13px] sm:text-sm" : "text-sm"
          )}>{label}</p>
          <div className={cn("font-bold tabular-nums", size === "sm" ? "text-xl" : size === "compact" ? "text-2xl sm:text-3xl" : "text-3xl")}>
            {value}
          </div>
          {hint && (
            <p className={cn(
              "truncate text-[oklch(0.48_0.045_285)]",
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
