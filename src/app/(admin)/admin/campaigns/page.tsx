import { Suspense } from "react";
import Link from "next/link";
import { CampaignListComponent } from "@/components/admin/campaign-list";

export const metadata = { title: "Admin - Campaigns" };

export default async function AdminCampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-slate-600">
            Create and manage email and WhatsApp marketing campaigns.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Campaign
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded" />
            ))}
          </div>
        }
      >
        <CampaignListComponent />
      </Suspense>
    </div>
  );
}
