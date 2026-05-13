import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";

export function LoginPrompt({ redirectUrl }: { redirectUrl: string }) {
  const loginHref = `/login?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <LogIn className="size-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Log in to continue</CardTitle>
        <CardDescription className="max-w-xs">
          You need to be logged in to request an appointment. Your selections
          will be preserved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <Link href={loginHref} className="w-full max-w-xs">
          <Button className="w-full" size="lg">
            <LogIn className="size-4" />
            Log in
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register?redirect_url=${encodeURIComponent(redirectUrl)}`}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
