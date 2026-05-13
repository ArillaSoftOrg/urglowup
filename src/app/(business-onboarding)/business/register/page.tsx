import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Register Your Business" };

const benefits = [
  "Create your professional business profile",
  "Showcase your work with photos and videos",
  "Let customers discover and request appointments",
  "Manage your services and working hours",
  "Build your reputation with verified reviews",
];

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Register Your Business</CardTitle>
          <CardDescription>
            Set up your business profile in a few simple steps. It only takes a
            couple of minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          <Link href="/business/onboarding" className="block">
            <Button className="w-full" size="lg">
              Get Started
            </Button>
          </Link>

          <p className="text-center text-xs text-muted-foreground">
            Already have a business?{" "}
            <Link
              href="/business/dashboard"
              className="font-medium text-primary hover:underline"
            >
              Go to Dashboard
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
