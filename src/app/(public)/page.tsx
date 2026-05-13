import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 md:py-32 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Discover Beauty &amp; Personal Care Professionals
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          View real work, read verified reviews, and request appointments with
          confidence.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Get Started
          </Link>
          <Link
            href="/for-business"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            For Business
          </Link>
        </div>
      </section>

      {/* Placeholder sections */}
      <section className="py-16 bg-muted/30 text-center px-4">
        <p className="text-muted-foreground">
          Categories, featured businesses, and more coming soon.
        </p>
      </section>
    </div>
  );
}
