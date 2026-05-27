import Link from "next/link";

const footerColumns = [
  {
    heading: "Kesfet",
    links: [
      { label: "Tum Uzmanlar", href: "/explore" },
      { label: "Kategoriler", href: "/explore" },
    ],
  },
  {
    heading: "Isletmeler",
    links: [
      { label: "Isletmeler Icin", href: "/for-business" },
      { label: "Isletme Kaydi", href: "/business/register" },
    ],
  },
  {
    heading: "Hesap",
    links: [
      { label: "Giris Yap", href: "/login" },
      { label: "Kayit Ol", href: "/register" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-lg font-bold tracking-[-0.02em] text-foreground"
            >
              UrGlowUp
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Guzelligini kesfet.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border/40 pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} UrGlowUp. Tum haklari saklidir.
          </p>
        </div>
      </div>
    </footer>
  );
}
