import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface ReviewRequestEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  reviewUrl: string;
}

export function ReviewRequestEmail({
  customerName,
  businessName,
  serviceName,
  reviewUrl,
}: ReviewRequestEmailProps) {
  const preview = `How was your experience at ${businessName}?`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hi {customerName || "there"},</Text>
      <Text style={body}>
        Your appointment at <strong>{businessName}</strong> for{" "}
        <strong>{serviceName}</strong> is now complete. We hope it went well!
      </Text>

      <Text style={body}>
        Would you take a moment to share your experience? Your review helps
        other customers and supports the business.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={reviewUrl}>
          Leave a Review
        </Button>
      </Section>

      <Text style={note}>
        You can only leave one review per appointment. Reviews help build trust
        in our community.
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

const buttonSection: React.CSSProperties = {
  margin: "24px 0 16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const note: React.CSSProperties = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
};
