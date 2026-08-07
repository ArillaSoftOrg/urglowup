import Link from "next/link";
import { CampaignEditor } from "@/components/admin/campaign-editor";

export const metadata = { title: "Admin - New Campaign" };

export default function NewCampaignPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/campaigns"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CampaignEditor />
      </div>
    </div>
  );
}
