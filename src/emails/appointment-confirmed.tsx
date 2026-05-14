import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentConfirmedEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  businessNote?: string;
  businessProfileUrl: string;
}

export function AppointmentConfirmedEmail({
  customerName,
  businessName,
  serviceName,
  requestedDate,
  requestedTime,
  businessNote,
  businessProfileUrl,
}: AppointmentConfirmedEmailProps) {
  const preview = `Your appointment at ${businessName} is confirmed`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hi {customerName || "there"},</Text>
      <Text style={body}>
        Great news! Your appointment at <strong>{businessName}</strong> has
        been confirmed.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <strong>Business:</strong> {businessName}
        </Text>
        <Text style={detailRow}>
          <strong>Service:</strong> {serviceName}
        </Text>
        <Text style={detailRow}>
          <strong>Date:</strong> {requestedDate}
        </Text>
        <Text style={detailRow}>
          <strong>Time:</strong> {requestedTime}
        </Text>
        {businessNote && (
          <Text style={detailRow}>
            <strong>Note from business:</strong> {businessNote}
          </Text>
        )}
      </Section>

      <Text style={body}>
        We look forward to seeing you. If you need to cancel, you can do so from
        your appointments page.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={businessProfileUrl}>
          View Business Profile
        </Button>
      </Section>
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

const detailsBox: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "6px",
  margin: "0 0 20px",
  padding: "16px 20px",
};

const detailRow: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px",
};

const buttonSection: React.CSSProperties = {
  margin: "24px 0 0",
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
