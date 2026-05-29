"use client";

import { useState } from "react";
import {
  sendMarketingEmailCampaign,
  sendMarketingWhatsAppCampaign,
} from "@/app/(admin)/admin/actions";
import type { AdminCampaignDetail } from "@/lib/queries/admin";

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
        // Reload the page to see updated status
        window.location.reload();
      }
    } catch (err) {
      setSendError("An error occurred");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "bg-gray-100", text: "text-gray-800" },
    READY: { bg: "bg-blue-100", text: "text-blue-800" },
    SENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
    SENT: { bg: "bg-green-100", text: "text-green-800" },
    PARTIAL_FAILURE: { bg: "bg-orange-100", text: "text-orange-800" },
    FAILED: { bg: "bg-red-100", text: "text-red-800" },
    ARCHIVED: { bg: "bg-slate-100", text: "text-slate-800" },
  };

  const colors = statusColors[campaign.status] || statusColors.DRAFT;

  // Calculate stats
  const sentCount = campaign.recipients.filter((r) => r.status === "SENT").length;
  const failedCount = campaign.recipients.filter((r) => r.status === "FAILED").length;
  const pendingCount = campaign.recipients.filter((r) => r.status === "PENDING").length;
  const skippedCount = campaign.recipients.filter((r) => r.status === "SKIPPED").length;

  const totalRecipients = campaign.recipientCount || campaign.recipients.length;
  const deliveryRate =
    totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Channel</h3>
            <p className="text-lg font-semibold">{campaign.channel}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}
            >
              {campaign.status}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Created By</h3>
            <p className="text-lg font-semibold">
              {campaign.createdBy.firstName} {campaign.createdBy.lastName}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
            <p className="text-lg font-semibold">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {campaign.status === "READY" && (
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleSendCampaign}
              disabled={isSending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isSending ? "Sending..." : "Send Campaign Now"}
            </button>
            {sendError && (
              <p className="mt-2 text-red-600 text-sm">{sendError}</p>
            )}
          </div>
        )}
      </div>

      {/* Delivery Stats */}
      {campaign.status !== "DRAFT" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold">{totalRecipients}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-green-600">{sentCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivery Rate</p>
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
                      className="flex justify-between text-sm text-gray-600"
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recipients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold">Email/Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Sent</th>
                  <th className="px-4 py-3 text-left font-semibold">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaign.recipients.slice(0, 50).map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {recipient.user?.firstName} {recipient.user?.lastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {recipient.recipientEmail || recipient.recipientPhone}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          recipient.status === "SENT"
                            ? "bg-green-100 text-green-800"
                            : recipient.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : recipient.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {recipient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {recipient.sentAt
                        ? new Date(recipient.sentAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600">
                      {recipient.errorMessage || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {campaign.recipients.length > 50 && (
            <div className="px-6 py-3 text-sm text-gray-600">
              Showing 50 of {campaign.recipients.length} recipients
            </div>
          )}
        </div>
      )}

      {campaign.recipients.length === 0 && campaign.status === "DRAFT" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-900">
            Create and configure this campaign to generate a recipient list.
          </p>
        </div>
      )}
    </div>
  );
}
