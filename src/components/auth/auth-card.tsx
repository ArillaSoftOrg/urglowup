import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  footerText: string;
  footerHref: string;
  footerLabel: string;
  children: React.ReactNode;
}

export function AuthCard({
  title,
  description,
  footerText,
  footerHref,
  footerLabel,
  children,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md border-border/70 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">UrGlowUp</CardTitle>
        <CardDescription>
          <span className="block text-base font-semibold text-foreground">
            {title}
          </span>
          <span className="mt-1 block">{description}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <p className="text-center text-sm text-muted-foreground">
          {footerText}{" "}
          <Link href={footerHref} className="font-medium text-foreground underline-offset-4 hover:underline">
            {footerLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
