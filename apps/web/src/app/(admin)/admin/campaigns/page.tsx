import { Suspense } from "react";
import Link from "next/link";
import { CampaignListComponent } from "@/components/admin/campaign-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Admin - Campaigns" };

export default async function AdminCampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email and WhatsApp marketing campaigns.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          + New Campaign
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        }
      >
        <CampaignListComponent />
      </Suspense>
    </div>
  );
}
