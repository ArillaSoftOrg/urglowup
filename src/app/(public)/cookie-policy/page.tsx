export const metadata = {
  title: "Cookie Policy",
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1>Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">
            UrGlowUp uses cookies for security, session management, locale selection,
            and optional experience preferences.
          </p>
        </div>

        <section className="space-y-2">
          <h2>Strictly Necessary Cookies</h2>
          <p className="text-sm text-muted-foreground">
            These cookies support sign-in, security checks, and core marketplace flows.
            They are required for the site to function properly.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Preference Cookies</h2>
          <p className="text-sm text-muted-foreground">
            Preference cookies can remember choices such as language and cookie consent
            state so the experience stays consistent across visits.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Managing Cookies</h2>
          <p className="text-sm text-muted-foreground">
            You can clear or block cookies in your browser settings. Some parts of the
            site may not work correctly if essential cookies are disabled.
          </p>
        </section>
      </div>
    </div>
  );
}
