import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";
import Link from "next/link";

export function MobileBookingBar({ slug }: { slug: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <Link href={`/b/${slug}/book`} className="block">
        <Button className="w-full" size="lg">
          <CalendarCheck className="size-4" />
          Request Appointment
        </Button>
      </Link>
    </div>
  );
}
