import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentCancelledByCustomerEmailProps {
  businessOwnerName: string;
  customerName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  dashboardUrl: string;
}

export function AppointmentCancelledByCustomerEmail({
  businessOwnerName,
  customerName,
  serviceName,
  requestedDate,
  requestedTime,
  dashboardUrl,
}: AppointmentCancelledByCustomerEmailProps) {
  const preview = `${customerName} has cancelled their appointment`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hi {businessOwnerName || "there"},</Text>
      <Text style={body}>
        <strong>{customerName}</strong> has cancelled their upcoming
        appointment.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <strong>Customer:</strong> {customerName}
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
        This time slot is now available again. View your appointments dashboard
        to manage your schedule.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={dashboardUrl}>
          View Dashboard
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
