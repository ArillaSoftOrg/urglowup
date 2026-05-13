import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} UrGlowUp. All rights reserved.
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/for-business"
              className="hover:text-foreground transition-colors"
            >
              For Business
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
