import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogIn } from "lucide-react";
import Link from "next/link";

export function LoginPrompt({ redirectUrl }: { redirectUrl: string }) {
  const loginHref = `/login?redirect_url=${encodeURIComponent(redirectUrl)}`;
  const registerHref = `/register?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <Card className="bg-surface-cream">
      <CardHeader className="items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-pink/20">
          <LogIn className="size-6 text-brand-pink-foreground" />
        </div>
        <CardTitle className="text-lg">Devam etmek için giriş yapın</CardTitle>
        <CardDescription className="max-w-xs">
          Seçimleriniz kaybolmayacak. Giriş yaptığınızda kaldığınız yerden
          devam edersiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <Link
          href={loginHref}
          className={cn(
            buttonVariants({ variant: "brand", size: "lg" }),
            "w-full max-w-xs gap-1.5"
          )}
        >
          <LogIn className="size-4" />
          Giriş Yap
        </Link>
        <p className="text-xs text-muted-foreground">
          Hesabınız yok mu?{" "}
          <Link
            href={registerHref}
            className="font-medium text-primary hover:underline"
          >
            Kayıt Olun
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
