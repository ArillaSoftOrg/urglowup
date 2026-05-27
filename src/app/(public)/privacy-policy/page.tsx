export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            UrGlowUp uses account, appointment, and preference data to deliver the
            service, protect the platform, and send essential booking updates.
          </p>
        </div>

        <section className="space-y-2">
          <h2>What We Collect</h2>
          <p className="text-sm text-muted-foreground">
            We collect information you provide directly, such as account details,
            business profile content, booking requests, and communication preferences.
          </p>
        </section>

        <section className="space-y-2">
          <h2>How We Use It</h2>
          <p className="text-sm text-muted-foreground">
            We use your information to operate the marketplace, support bookings,
            personalize parts of the experience where permitted, and maintain safety.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Notifications and Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Transactional messages may be used for booking confirmations, updates, and
            reminders. Marketing communication and non-essential personalization should
            follow your saved preferences.
          </p>
        </section>

        <section className="space-y-2">
          <h2>Your Choices</h2>
          <p className="text-sm text-muted-foreground">
            You can review and update parts of your preferences from your account
            settings. For privacy-related requests, contact the site operator.
          </p>
        </section>
      </div>
    </div>
  );
}
