"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import {
  sendMarketingEmailCampaign,
  sendMarketingWhatsAppCampaign,
} from "@/app/(admin)/admin/actions";
import type { AdminCampaignDetail } from "@/lib/queries/admin";
import { WhatsAppCampaignStatus } from "./whatsapp-campaign-status";

function campaignStatusVariant(status: string): BadgeVariant {
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

function recipientStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "SENT": return "success";
    case "FAILED": return "destructive";
    case "PENDING": return "warning";
    default: return "neutral";
  }
}

export function CampaignDetailComponent({
  campaign,
}: {
  campaign: AdminCampaignDetail;
}) {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string>("");

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const handleSendCampaign = async () => {
    if (
      !confirm(
        `Send this ${campaign.channel} campaign to ${campaign.recipients.length} recipients?`
      )
    ) {
      return;
    }

    setIsSending(true);
    setSendError("");

    try {
      const result =
        campaign.channel === "EMAIL"
          ? await sendMarketingEmailCampaign(campaign.id)
          : await sendMarketingWhatsAppCampaign(campaign.id);

      if (!result.success) {
        setSendError(result.message || "Failed to send campaign");
      } else {
        window.location.reload();
      }
    } catch (err) {
      setSendError("An error occurred");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const sentCount = campaign.recipients.filter((r) => r.status === "SENT").length;
  const failedCount = campaign.recipients.filter((r) => r.status === "FAILED").length;
  const pendingCount = campaign.recipients.filter((r) => r.status === "PENDING").length;

  const totalRecipients = campaign.recipientCount || campaign.recipients.length;
  const deliveryRate =
    totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Channel</h3>
            <p className="text-lg font-semibold">{campaign.channel}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
            <Badge variant={campaignStatusVariant(campaign.status)} className="text-sm px-3 py-1">
              {campaign.status}
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Created By</h3>
            <p className="text-lg font-semibold">
              {campaign.createdBy.firstName} {campaign.createdBy.lastName}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
            <p className="text-lg font-semibold">
              {new Date(campaign.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </div>

        {campaign.status === "READY" && (
          <div className="mt-6 pt-6 border-t space-y-4">
            {campaign.channel === "WHATSAPP" && (
              <WhatsAppCampaignStatus templateName={campaign.templateName || undefined} />
            )}
            <button
              onClick={handleSendCampaign}
              disabled={isSending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {isSending ? "Sending..." : "Send Campaign Now"}
            </button>
            {sendError && (
              <p className="mt-2 text-destructive text-sm">{sendError}</p>
            )}
          </div>
        )}
      </div>

      {/* Delivery Stats */}
      {campaign.status !== "DRAFT" && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Recipients</p>
              <p className="text-2xl font-bold">{totalRecipients}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold text-success-foreground">{sentCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-destructive">{failedCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning-foreground">{pendingCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Rate</p>
              <p className="text-2xl font-bold">{deliveryRate}%</p>
            </div>
          </div>

          {failedCount > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Error Summary</h4>
              <div className="space-y-2">
                {(() => {
                  const errorCounts: Record<string, number> = {};
                  campaign.recipients
                    .filter((r) => r.status === "FAILED")
                    .forEach((r) => {
                      const error = r.errorMessage || "Unknown error";
                      errorCounts[error] = (errorCounts[error] || 0) + 1;
                    });
                  return Object.entries(errorCounts).map(([error, count]) => (
                    <div
                      key={error}
                      className="flex justify-between text-sm text-muted-foreground"
                    >
                      <span>{error}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recipients Table */}
      {campaign.recipients.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recipients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold">Email/Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Sent</th>
                  <th className="px-4 py-3 text-left font-semibold">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaign.recipients.slice(0, 50).map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      {recipient.user?.firstName} {recipient.user?.lastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {recipient.recipientEmail || recipient.recipientPhone}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={recipientStatusVariant(recipient.status)}>
                        {recipient.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {recipient.sentAt
                        ? new Date(recipient.sentAt).toLocaleString("en-US")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-destructive">
                      {recipient.errorMessage || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {campaign.recipients.length > 50 && (
            <div className="px-6 py-3 text-sm text-muted-foreground">
              Showing 50 of {campaign.recipients.length} recipients
            </div>
          )}
        </div>
      )}

      {campaign.recipients.length === 0 && campaign.status === "DRAFT" && (
        <div className="bg-info/10 border border-info/30 rounded-lg p-6 text-center">
          <p className="text-info-foreground">
            Create and configure this campaign to generate a recipient list.
          </p>
        </div>
      )}
    </div>
  );
}
