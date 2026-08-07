import { redirect } from "next/navigation";
import { normalizeAuthRedirect } from "@/lib/auth-redirect";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function ResetPasswordTokenCallbackPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { callbackURL } = await searchParams;
  const callbackPath = normalizeAuthRedirect(callbackURL, "/reset-password");
  const target = new URL(callbackPath, "https://urglowup.local");

  target.searchParams.set("token", token);

  redirect(`${target.pathname}${target.search}`);
}
