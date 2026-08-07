import { redirect } from "next/navigation";
import { verifyAndUseUnsubscribeToken, revokeMarketingConsent } from "@/lib/unsubscribe";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify the token
    const userId = await verifyAndUseUnsubscribeToken(token);

    if (!userId) {
      // Invalid or already-used token
      redirect("/unsubscribe/invalid");
    }

    // Revoke marketing consent
    await revokeMarketingConsent(userId);

    // Redirect to success page
    redirect("/unsubscribe/success");
  } catch (err) {
    console.error("[unsubscribe] Error processing unsubscribe request:", err);
    redirect("/unsubscribe/error");
  }
}
