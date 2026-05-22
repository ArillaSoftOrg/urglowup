import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

export async function Navbar() {
  const user = await getCurrentUser();

  const navLink = user
    ? user.role === UserRole.BUSINESS_OWNER
      ? { label: "İşletme Paneliniz", href: "/business/dashboard" }
      : user.role === UserRole.ADMIN
        ? { label: "Admin Paneli", href: "/admin" }
        : { label: "Hesabım", href: "/account" }
    : { label: "İşletmeler İçin", href: "/for-business" };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          UrGlowUp
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/explore"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Keşfet
          </Link>
          <Link
            href={navLink.href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {navLink.label}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserButton />
          ) : (
            <>
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Giriş Yap
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Kayıt Ol</Button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
