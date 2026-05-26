import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Map } from "lucide-react";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const alternates = buildAlternates("/map", locale);
  return {
    title: "Map",
    description: "Discover beauty and personal care professionals near you on the map.",
    openGraph: {
      title: "Map | UrGlowUp",
      description: "Discover beauty and personal care professionals near you on the map.",
      url: `/${locale}/map`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleMapPage({ params }: PageProps) {
  const { locale } = await params;
  const p = (path: string) => `/${locale}${path}`;

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
        <Link href={p("/explore")} className={buttonVariants({ variant: "default" })}>
          Browse All
        </Link>
        <Link href={p("/")} className={buttonVariants({ variant: "outline" })}>
          Go Home
        </Link>
      </div>
    </div>
  );
}
