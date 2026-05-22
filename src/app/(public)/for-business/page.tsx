import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Camera,
  Globe,
  Star,
  Users,
  Zap,
} from "lucide-react";

export const metadata = { title: "For Business" };

const features = [
  {
    icon: Globe,
    title: "Professional Profile",
    description:
      "Get a beautiful public page to showcase your business, services, and portfolio.",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Requests",
    description:
      "Let customers request appointments directly from your profile. You stay in control.",
  },
  {
    icon: Camera,
    title: "Portfolio Gallery",
    description:
      "Upload photos and videos of your work to attract new customers.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description:
      "Build trust with verified reviews from customers who completed appointments.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Keep track of your customers, their appointments, and preferences.",
  },
  {
    icon: Zap,
    title: "Easy to Use",
    description:
      "Set up in minutes. No technical knowledge required. Works on any device.",
  },
];

const steps = [
  {
    number: "1",
    title: "Create your account",
    description: "Sign up and tell us about your business.",
  },
  {
    number: "2",
    title: "Set up your profile",
    description: "Add your services, working hours, and photos.",
  },
  {
    number: "3",
    title: "Share your link",
    description: "Share your public page on social media and start getting appointment requests.",
  },
];

export default function ForBusinessPage() {
  return (
    <div>
      {/* Hero */}
      <section className="px-4 py-20 text-center md:py-32">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Grow Your Beauty Business Online
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Create your professional profile, showcase your work, and let
          customers request appointments — all in one place.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/business/register"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Register Your Business
          </Link>
          <a
            href="#how-it-works"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            How It Works
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Free to get started. No credit card required.
        </p>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to succeed
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            UrGlowUp gives you the tools to manage and grow your beauty
            business.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Get started in 3 easy steps
          </h2>
          <div className="mt-12 space-y-8">
            {steps.map((s) => (
              <div key={s.number} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.number}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/business/register"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
