import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignDetail } from "@/lib/queries/admin";
import { CampaignEditor } from "@/components/admin/campaign-editor";

export const metadata = { title: "Admin - Edit Campaign" };

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignDetail(id);

  if (!campaign) {
    notFound();
  }

  if (campaign.status !== "DRAFT") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/campaigns/${id}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CampaignEditor
          campaignId={id}
          initialData={{
            name: campaign.name,
            channel: campaign.channel as "EMAIL" | "WHATSAPP",
            subject: campaign.subject || undefined,
            contentJson: campaign.contentJson || undefined,
            templateName: campaign.templateName || undefined,
          }}
        />
      </div>
    </div>
  );
}
