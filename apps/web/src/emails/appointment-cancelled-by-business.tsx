import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentCancelledByBusinessEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  exploreUrl: string;
}

export function AppointmentCancelledByBusinessEmail({
  customerName,
  businessName,
  serviceName,
  requestedDate,
  requestedTime,
  exploreUrl,
}: AppointmentCancelledByBusinessEmailProps) {
  const preview = `Your appointment at ${businessName} has been cancelled`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hi {customerName || "there"},</Text>
      <Text style={body}>
        We are sorry to let you know that <strong>{businessName}</strong> has
        cancelled your upcoming appointment.
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
      </Section>

      <Text style={body}>
        You can book a new appointment with this business or explore other
        options on UrGlowUp.
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
