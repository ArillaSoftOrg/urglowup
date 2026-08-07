import { MfaChallengeForm } from "@/components/admin/mfa-challenge-form";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export const metadata = { title: "Admin - MFA Verification" };

function normalizeChallengeRedirect(next?: string) {
  if (!next) {
    return "/admin";
  }

  try {
    const decoded = decodeURIComponent(next);
    return decoded.startsWith("/") && !decoded.startsWith("//")
      ? decoded
      : "/admin";
  } catch {
    return "/admin";
  }
}

export default async function MfaChallengePage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const redirectTo = normalizeChallengeRedirect(next);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <MfaChallengeForm redirectTo={redirectTo} />
    </div>
  );
}
