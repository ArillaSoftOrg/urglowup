import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";
import Link from "next/link";

interface MobileBookingBarProps {
  slug: string;
  isOpen?: boolean;
  locale?: string;
}

export function MobileBookingBar({
  slug,
  isOpen,
  locale,
}: MobileBookingBarProps) {
  const prefix = locale && locale !== "tr" ? `/${locale}` : "";
  const isEnglish = locale === "en" || locale === "de";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 pb-4 pt-3 shadow-[0_-8px_24px_oklch(0.2_0.01_10/0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden">
      {isOpen === true && (
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-green-500 align-middle" />
          {isEnglish ? "Open now" : "Su an acik"}
        </p>
      )}
      <Link href={`${prefix}/b/${slug}/book`} className="block">
        <Button className="h-12 w-full rounded-full" size="lg">
          <CalendarCheck className="size-4" />
          {isEnglish ? "Book now" : "Randevu al"}
        </Button>
      </Link>
    </div>
  );
}
