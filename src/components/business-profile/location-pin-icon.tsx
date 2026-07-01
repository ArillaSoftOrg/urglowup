import { cn } from "@/lib/utils";

export function LocationPinIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center text-foreground",
        className
      )}
    >
      <span className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-[58%] rotate-45 rounded-[50%_50%_50%_0] bg-current ring-1 ring-background/80" />
      <span className="relative size-1.5 rounded-full bg-background" />
    </span>
  );
}
