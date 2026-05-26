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
  size?: "default" | "sm";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["iconTone"]>, string> = {
  pink: "bg-brand-pink/20 text-brand-pink-foreground",
  warning: "bg-warning/40 text-warning-foreground",
  info: "bg-info/40 text-info-foreground",
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
        "h-full transition-colors",
        surface === "cream" && "bg-surface-cream",
        href && "hover:bg-surface-pink/40"
      )}
    >
      <CardContent
        className={cn(
          "flex items-start justify-between gap-2",
          size === "sm" ? "p-3" : "p-4 gap-3"
        )}
      >
        <div className={cn("min-w-0", size === "sm" ? "space-y-0.5" : "space-y-1")}>
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <div className={cn("font-bold", size === "sm" ? "text-xl" : "text-2xl")}>
            {value}
          </div>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            size === "sm" ? "size-8" : "size-10",
            TONE_CLASSES[iconTone]
          )}
        >
          <Icon className={size === "sm" ? "size-4" : "size-5"} />
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
