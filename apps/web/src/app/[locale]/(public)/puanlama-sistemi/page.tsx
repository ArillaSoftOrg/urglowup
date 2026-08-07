import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BadgeCheck,
  BarChart2,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const alternates = buildAlternates("/puanlama-sistemi", locale);
  return {
    title: { absolute: "Rating System | UrGlowUp" },
    description:
      "Learn how UrGlowUp's review and rating system works: verified reviews, 0–10 scoring, recency weighting, and fair business scores.",
    openGraph: {
      title: "Rating System | UrGlowUp",
      description:
        "Learn how UrGlowUp's review and rating system works.",
      url: `/${locale}/puanlama-sistemi`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

const customerCards = [
  {
    icon: BadgeCheck,
    title: "Verified reviews",
    description: "Only reviews from real appointment experiences are highlighted.",
  },
  {
    icon: SlidersHorizontal,
    title: "0–10 precise scoring",
    description:
      "Instead of a classic star system, a sliding scale lets you express your experience more precisely.",
  },
  {
    icon: Clock,
    title: "Current quality tracking",
    description:
      "Recent reviews carry more weight, so the business's recent performance shows more accurately.",
  },
] as const;

const businessCards = [
  {
    icon: BarChart2,
    title: "No artificial boost with few reviews",
    description:
      "New businesses can't jump to the top with just a few high scores; the system considers a trust threshold.",
  },
  {
    icon: TrendingUp,
    title: "Old reviews don't carry the same weight forever",
    description:
      "Reviews from years ago aren't deleted, but they count with lower weight compared to current performance.",
  },
  {
    icon: ShieldCheck,
    title: "Protection against fake and low-trust reviews",
    description:
      "Appointment verification, trust weighting, and suspicious behavior signals are factored into the score.",
  },
] as const;

const howItWorksItems = [
  {
    number: "01",
    title: "The Given Score",
    description:
      "The customer gives a score from 0–10 after the appointment. This value forms the basis of the calculation.",
  },
  {
    number: "02",
    title: "Recency Effect",
    description:
      "Recent reviews carry more weight. Old reviews are not deleted; their impact gradually decreases over time.",
  },
  {
    number: "03",
    title: "Trust Weight",
    description:
      "Reviews linked to completed appointments and with high reliability signals impact the final score much more strongly.",
  },
  {
    number: "04",
    title: "Confidence Threshold Balance",
    description:
      "For businesses with few reviews, the score is balanced with the platform average. As more real appointment experiences arrive, this balance lifts.",
  },
] as const;

export default async function LocaleRatingSystemPage({ params }: PageProps) {
  const { locale } = await params;
  const p = (path: string) => `/${locale}${path}`;

  return (
    <div className="flex flex-col">
      <section className="bg-background px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="pink" className="mb-4">
            Rating System
          </Badge>
          <h1 className="text-3xl font-bold leading-[1.1] tracking-[-0.02em] md:text-5xl">
            Scores aren&apos;t just numbers —{" "}
            <span className="text-brand-pink-foreground">
              they&apos;re built from real experiences.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            On UrGlowUp, reviews are based on completed appointments. Scores are
            calculated considering recency, verified experience, and reliability signals.
          </p>
        </div>
      </section>

      <section className="bg-surface-pink px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <Badge variant="pink" className="mb-3">
              For Users
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              More trustworthy decisions for users
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {customerCards.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-pink/20">
                    <Icon className="size-5 text-brand-pink-foreground" strokeWidth={1.75} />
                  </div>
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription className="leading-relaxed">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-purple px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <Badge variant="purple" className="mb-3">
              For Businesses
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              Fairer visibility for businesses
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {businessCards.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-purple/20">
                    <Icon className="size-5 text-brand-purple-foreground" strokeWidth={1.75} />
                  </div>
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription className="leading-relaxed">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-cream px-4 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.015em] md:text-3xl">
              How does the system calculate?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Four core factors are evaluated together to produce a reliable score for each business.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {howItWorksItems.map(({ number, title, description }) => (
              <div key={number} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-pink/15 text-sm font-bold tabular-nums text-brand-pink-foreground">
                  {number}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.015em] text-white md:text-3xl">
            Make decisions based on real experiences.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Discover businesses with verified reviews or add your own business to the platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={p("/explore")}
              className={cn(buttonVariants({ size: "lg" }), "bg-white px-8 text-foreground hover:bg-white/90")}
            >
              Discover Businesses
            </Link>
            <Link
              href={p("/for-business")}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/20 px-8 text-white hover:bg-white/10 hover:text-white"
              )}
            >
              Add Your Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
