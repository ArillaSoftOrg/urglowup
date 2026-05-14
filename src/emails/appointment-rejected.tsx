import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentRejectedEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  exploreUrl: string;
}

export function AppointmentRejectedEmail({
  customerName,
  businessName,
  serviceName,
  requestedDate,
  requestedTime,
  exploreUrl,
}: AppointmentRejectedEmailProps) {
  const preview = `Your appointment request at ${businessName} was not approved`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hi {customerName || "there"},</Text>
      <Text style={body}>
        Unfortunately, <strong>{businessName}</strong> was unable to accept
        your appointment request at this time.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <strong>Business:</strong> {businessName}
        </Text>
        <Text style={detailRow}>
          <strong>Service:</strong> {serviceName}
        </Text>
        <Text style={detailRow}>
          <strong>Date requested:</strong> {requestedDate}
        </Text>
        <Text style={detailRow}>
          <strong>Time requested:</strong> {requestedTime}
        </Text>
      </Section>

      <Text style={body}>
        You can try booking a different time or explore other businesses on
        UrGlowUp.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={exploreUrl}>
          Explore Businesses
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
  backgroundColor: "#f4f4f5",
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
