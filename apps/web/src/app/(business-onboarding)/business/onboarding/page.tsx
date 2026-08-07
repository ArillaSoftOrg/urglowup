import { OnboardingWizard } from "@/components/business/onboarding-wizard";

export const metadata = { title: "Business Onboarding" };

export default function OnboardingPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Set Up Your Business
        </h1>
        <p className="mt-2 text-muted-foreground">
          Complete these steps to create your business profile.
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}
