import Link from "next/link";
import { getCampaigns } from "@/lib/queries/admin";
import { CampaignStatus } from "@/generated/prisma/enums";

const statusColors: Record<CampaignStatus, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-800" },
  READY: { bg: "bg-blue-100", text: "text-blue-800" },
  SENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
  SENT: { bg: "bg-green-100", text: "text-green-800" },
  PARTIAL_FAILURE: { bg: "bg-orange-100", text: "text-orange-800" },
  FAILED: { bg: "bg-red-100", text: "text-red-800" },
  ARCHIVED: { bg: "bg-slate-100", text: "text-slate-800" },
};

export async function CampaignListComponent() {
  const campaigns = await getCampaigns() || [];

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-slate-600">No campaigns yet. Create your first one!</p>
        <Link
          href="/admin/campaigns/new"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Channel</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Recipients</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
            <th className="px-4 py-3 text-left font-semibold">Sent</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {campaigns.map((campaign) => {
            const colors =
              statusColors[campaign.status as CampaignStatus] ||
              statusColors.DRAFT;

            return (
              <tr key={campaign.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{campaign.name}</td>
                <td className="px-4 py-3 capitalize">{campaign.channel.toLowerCase()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {campaign.recipientCount ?? 0}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {campaign.sentAt
                    ? new Date(campaign.sentAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="text-blue-600 hover:underline text-xs font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
