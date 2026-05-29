"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaign,
  updateCampaign,
  snapshotCampaignAudience,
  getEmailMarketingAudienceCount,
} from "@/app/(admin)/admin/actions";

interface CampaignEditorProps {
  campaignId?: string;
  initialData?: {
    name: string;
    channel: "EMAIL" | "WHATSAPP";
    subject?: string;
    contentJson?: any;
    templateName?: string;
  };
}

export function CampaignEditor({ campaignId, initialData }: CampaignEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    channel: (initialData?.channel || "EMAIL") as "EMAIL" | "WHATSAPP",
    subject: initialData?.subject || "",
    contentJson: initialData?.contentJson || null,
    templateName: initialData?.templateName || "",
  });

  const [audienceFilters, setAudienceFilters] = useState({
    roles: [] as string[],
  });

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const updateRecipientCount = useCallback(async () => {
    if (formData.channel !== "EMAIL") return;

    const result = await getEmailMarketingAudienceCount(audienceFilters);
    if (result.success) {
      setRecipientCount(result.count);
    }
  }, [formData.channel, audienceFilters]);


  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result: any = campaignId
        ? await updateCampaign(campaignId, formData)
        : await createCampaign(formData);

      if (result.success) {
        if (result.campaignId) {
          router.push(`/admin/campaigns/${result.campaignId}`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.message || "Failed to save campaign");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignId) {
      setError("Save as draft first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await snapshotCampaignAudience(campaignId, audienceFilters);
      if (result.success) {
        router.push(`/admin/campaigns/${campaignId}`);
      } else {
        setError(result.message || "Failed to prepare audience");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Summer Beauty Promo"
            required
          />
        </div>

        {/* Channel Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel
          </label>
          <div className="flex gap-4">
            {(["EMAIL", "WHATSAPP"] as const).map((channel) => (
              <label key={channel} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="channel"
                  value={channel}
                  checked={formData.channel === channel}
                  onChange={(e) =>
                    setFormData({ ...formData, channel: e.target.value as "EMAIL" | "WHATSAPP" })
                  }
                  disabled={!!campaignId}
                  className="w-4 h-4"
                />
                <span>{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Email-specific fields */}
        {formData.channel === "EMAIL" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email subject"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body (HTML)
              </label>
              <textarea
                value={formData.contentJson?.body || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    contentJson: { body: e.target.value },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={8}
                placeholder="<p>Your email content here...</p>"
              />
            </div>
          </>
        )}

        {/* Audience Filter Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Audience</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Roles
            </label>
            <div className="space-y-2">
              {["CUSTOMER", "BUSINESS_OWNER"].map((role) => (
                <label key={role} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={audienceFilters.roles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAudienceFilters({
                          ...audienceFilters,
                          roles: [...audienceFilters.roles, role],
                        });
                      } else {
                        setAudienceFilters({
                          ...audienceFilters,
                          roles: audienceFilters.roles.filter((r) => r !== role),
                        });
                      }
                      updateRecipientCount();
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {recipientCount !== null && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong>Estimated Recipients:</strong> {recipientCount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>

          {campaignId && (
            <button
              type="button"
              onClick={handleSubmitForSend}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Preparing..." : "Submit for Send"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
