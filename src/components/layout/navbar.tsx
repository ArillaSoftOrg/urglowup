import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const { userId } = await auth();

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
            Explore
          </Link>
          <Link
            href="/for-business"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            For Business
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {userId ? (
            <UserButton />
          ) : (
            <>
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
