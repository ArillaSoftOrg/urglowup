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
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "h-full transition-colors",
        surface === "cream" && "bg-surface-cream",
        href && "hover:bg-surface-pink/40"
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="text-2xl font-bold">{value}</div>
          {hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            TONE_CLASSES[iconTone]
          )}
        >
          <Icon className="size-5" />
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
