import Link from "next/link";

const footerColumns = [
  {
    heading: "Keşfet",
    links: [
      { label: "Tüm Uzmanlar", href: "/explore" },
      { label: "Kategoriler", href: "/explore" },
    ],
  },
  {
    heading: "İşletmeler",
    links: [
      { label: "İşletmeler İçin", href: "/for-business" },
      { label: "İşletme Kaydı", href: "/business/register" },
    ],
  },
  {
    heading: "Hesap",
    links: [
      { label: "Giriş Yap", href: "/login" },
      { label: "Kayıt Ol", href: "/register" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-lg font-bold tracking-[-0.02em] text-foreground"
            >
              UrGlowUp
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Güzelliğini keşfet.
            </p>
          </div>

          {/* Nav columns */}
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
            &copy; {new Date().getFullYear()} UrGlowUp. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
