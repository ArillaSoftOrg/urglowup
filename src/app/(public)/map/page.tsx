import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";

export const metadata: Metadata = {
  title: "Map",
  description: "Map discovery for beauty and personal care professionals.",
};

export default function MapPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Map className="size-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Map Discovery</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Interactive map coming soon. In the meantime, browse professionals by
        category or city.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/explore">Browse All</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
