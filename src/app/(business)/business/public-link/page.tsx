import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { getBusinessForPublicLink } from "@/lib/queries/business";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { env } from "@/lib/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/business/copy-button";
import { QRCodeCard } from "@/components/business/qr-code-card";
import { InstagramBioText, WhatsAppShareText } from "@/components/business/sharing-texts";
import { ProfileCompletionCard } from "@/components/business/profile-completion-card";
import { AlertCircle, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Public Link" };

export default async function PublicLinkPage() {
  const { businessId } = await requireBusiness();

  const business = await getBusinessForPublicLink(businessId);
  if (!business) notFound();

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const publicUrl = `${appUrl}/b/${business.slug}`;

  const completion = calculateProfileCompletion(business);

  const isVisible =
    business.status === "ACTIVE_PRIVATE" || business.status === "ACTIVE_MARKETPLACE";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Share Your Booking Page</h1>
        <p className="mt-1 text-muted-foreground">
          Share your link with customers so they can book appointments and view your services.
        </p>
      </div>

      {/* Status warning */}
      {!isVisible && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Your profile is not publicly visible</p>
            <p className="mt-0.5 text-yellow-700">
              Your account status is <strong>{business.status}</strong>. Complete your profile
              setup to make your booking page accessible to customers.
            </p>
          </div>
        </div>
      )}

      {/* Public URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Your Booking Link
          </CardTitle>
          <CardDescription>
            Share this link on social media, in messages, or anywhere customers can find you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <span className="flex-1 truncate text-sm font-medium">{publicUrl}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={publicUrl} label="Copy Link" />
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="size-4" />
              Open Profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <QRCodeCard publicUrl={publicUrl} businessSlug={business.slug} />

      {/* Sharing texts */}
      <div className="grid gap-6 sm:grid-cols-2">
        <InstagramBioText publicUrl={publicUrl} />
        <WhatsAppShareText publicUrl={publicUrl} />
      </div>

      {/* Profile completion */}
      <ProfileCompletionCard completion={completion} />
    </div>
  );
}
