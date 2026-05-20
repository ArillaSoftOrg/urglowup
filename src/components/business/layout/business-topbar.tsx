import { Sparkles } from "lucide-react";
import { BusinessMobileNav } from "./business-mobile-nav";

export function BusinessTopbar() {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <BusinessMobileNav />
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-brand-pink/20">
          <Sparkles className="size-3.5 text-brand-pink-foreground" />
        </span>
        <span className="text-base font-bold tracking-tight">UrGlowUp</span>
      </div>
    </header>
  );
}
