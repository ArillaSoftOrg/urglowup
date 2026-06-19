import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCampaigns } from "@/lib/queries/admin";
import { CampaignStatus } from "@/generated/prisma/enums";
import type { BadgeVariant } from "@/components/ui/badge";

function campaignStatusVariant(status: CampaignStatus): BadgeVariant {
  switch (status) {
    case "DRAFT": return "neutral";
    case "READY": return "info";
    case "SENDING": return "warning";
    case "SENT": return "success";
    case "PARTIAL_FAILURE": return "warning";
    case "FAILED": return "destructive";
    case "ARCHIVED": return "secondary";
    default: return "neutral";
  }
}

export async function CampaignListComponent() {
  const campaigns = await getCampaigns() || [];

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-8 text-center">
        <p className="text-muted-foreground">No campaigns yet. Create your first one!</p>
        <Link
          href="/admin/campaigns/new"
          className={buttonVariants({ variant: "default", size: "sm" }) + " mt-4 inline-flex"}
        >
          Create Campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted">
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
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{campaign.name}</td>
              <td className="px-4 py-3 capitalize">{campaign.channel.toLowerCase()}</td>
              <td className="px-4 py-3">
                <Badge variant={campaignStatusVariant(campaign.status as CampaignStatus)}>
                  {campaign.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {campaign.recipientCount ?? 0}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(campaign.createdAt).toLocaleDateString("en-US")}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {campaign.sentAt
                  ? new Date(campaign.sentAt).toLocaleDateString("en-US")
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="text-primary hover:underline text-xs font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
