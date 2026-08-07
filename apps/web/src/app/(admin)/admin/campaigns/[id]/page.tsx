import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getCampaignDetail } from "@/lib/queries/admin";
import { CampaignDetailComponent } from "@/components/admin/campaign-detail";

export const metadata = { title: "Admin - Campaign" };

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignDetail(id);

  if (!campaign) {
    notFound();
  }

  const isEditable = campaign.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/campaigns"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Campaigns
          </Link>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
        </div>

        {isEditable && (
          <Link
            href={`/admin/campaigns/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Edit Campaign
          </Link>
        )}
      </div>

      <Suspense
        fallback={
          <div className="h-96 bg-gray-100 rounded animate-pulse" />
        }
      >
        <CampaignDetailComponent campaign={campaign} />
      </Suspense>
    </div>
  );
}
