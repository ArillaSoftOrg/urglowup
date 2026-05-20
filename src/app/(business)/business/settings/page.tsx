import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Settings" };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ACTIVE_PRIVATE: "Active (Private)",
  ACTIVE_MARKETPLACE: "Active (Marketplace)",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "neutral" | "secondary" | "info"> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  ACTIVE_PRIVATE: "info",
  ACTIVE_MARKETPLACE: "success",
  SUSPENDED: "destructive",
  REJECTED: "destructive",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  DRAFT: "Your profile is in draft mode and not visible to customers.",
  PENDING_APPROVAL: "Your profile is awaiting review by the UrGlowUp team.",
  ACTIVE_PRIVATE: "Your profile is live at your booking link but not yet listed in the marketplace.",
  ACTIVE_MARKETPLACE: "Your profile is live and visible in the marketplace.",
  SUSPENDED: "Your profile has been suspended. Contact support for more information.",
  REJECTED: "Your profile was not approved. Contact support for more information.",
};

export default async function SettingsPage() {
  const { businessId } = await requireBusiness();

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      name: true,
      slug: true,
      status: true,
      isMarketplaceVisible: true,
      createdAt: true,
    },
  });

  if (!business) notFound();

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const publicUrl = `${appUrl}/b/${business.slug}`;

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Settings"
        description="Manage your business account settings."
      />

      {/* Business Visibility / Status */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4" />
                Profile Status
              </CardTitle>
              <CardDescription>
                Your current profile visibility and marketplace status.
              </CardDescription>
            </div>
            <Badge variant={STATUS_VARIANTS[business.status] ?? "neutral"}>
              {STATUS_LABELS[business.status] ?? business.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-surface-cream p-4">
            <p className="text-sm text-muted-foreground">
              {STATUS_DESCRIPTIONS[business.status] ?? ""}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Marketplace Visibility
                </p>
                <p className="mt-0.5 font-medium">
                  {business.isMarketplaceVisible ? "Visible" : "Not listed"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Member Since
                </p>
                <p className="mt-0.5 font-medium">
                  {new Date(business.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            To change your profile status, contact{" "}
            <a href="mailto:support@urglowup.com" className="underline underline-offset-2">
              support@urglowup.com
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Slug / Public URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public Booking URL</CardTitle>
          <CardDescription>
            Your unique booking link shared with customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface-cream px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-medium text-muted-foreground">
              /b/
            </span>
            <span className="text-sm font-semibold">{business.slug}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="size-3.5" />
              Open Profile
            </Link>
            <Link
              href="/business/public-link"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Share options
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            To change your URL slug, contact{" "}
            <a href="mailto:support@urglowup.com" className="underline underline-offset-2">
              support@urglowup.com
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your entire account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Delete Business</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Permanently delete your business profile, services, media, and all data.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled
              title="Contact support to delete your account"
              className="shrink-0"
            >
              Delete Business
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            To delete your business, contact{" "}
            <a href="mailto:support@urglowup.com" className="underline underline-offset-2">
              support@urglowup.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
