import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface ContentModeratedEmailProps {
  businessName: string;
  contentType: "review" | "post" | "media";
  action: "hidden" | "removed";
  reason?: string;
}

export function ContentModeratedEmail({
  businessName,
  contentType,
  action,
  reason,
}: ContentModeratedEmailProps) {
  const contentLabel = {
    review: "customer review",
    post: "post",
    media: "media item",
  }[contentType];

  const actionLabel = action === "hidden" ? "hidden" : "removed";

  const preview = `A ${contentLabel} from your ${businessName} profile has been ${actionLabel}`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hello,</Text>

      <Text style={body}>
        A {contentLabel} from your <strong>{businessName}</strong> profile has been{" "}
        <strong>{actionLabel}</strong> by our moderation team.
      </Text>

      {reason && (
        <Section style={reasonBox}>
          <Text style={reasonLabel}>Reason:</Text>
          <Text style={reasonText}>{reason}</Text>
        </Section>
      )}

      <Text style={body}>
        {action === "hidden"
          ? "This content is no longer visible to the public, but you can view and edit it from your dashboard."
          : "This content has been permanently removed and is no longer available."}
      </Text>

      <Text style={body}>
        If you have questions about this action, please contact our support team.
      </Text>

      <Text style={note}>
        Thank you for being part of our community and helping us maintain a safe and
        trustworthy platform.
      </Text>
    </EmailLayout>
  );
}

const greeting: React.CSSProperties = {
  color: "#18181b",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const body: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const reasonBox: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fcd34d",
  borderRadius: "6px",
  padding: "12px",
  margin: "16px 0",
};

const reasonLabel: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const reasonText: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "20px",
  margin: 0,
};

const note: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
};
