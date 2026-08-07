import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentRescheduleRequestEmailProps {
  businessOwnerName: string;
  customerName: string;
  serviceName: string;
  originalDate: string;
  originalTime: string;
  requestedDate: string;
  requestedTime: string;
  dashboardUrl: string;
}

export function AppointmentRescheduleRequestEmail({
  businessOwnerName,
  customerName,
  serviceName,
  originalDate,
  originalTime,
  requestedDate,
  requestedTime,
  dashboardUrl,
}: AppointmentRescheduleRequestEmailProps) {
  const preview = `${customerName} requested to reschedule their appointment`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Hi {businessOwnerName || "there"},</Text>
      <Text style={body}>
        <strong>{customerName}</strong> has requested to reschedule their
        appointment.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>
        <Text style={detailRow}>
          <strong>Service:</strong> {serviceName}
        </Text>
        <Text style={sectionTitle}>Original appointment:</Text>
        <Text style={subDetailRow}>
          <strong>Date:</strong> {originalDate}
        </Text>
        <Text style={subDetailRow}>
          <strong>Time:</strong> {originalTime}
        </Text>
        <Text style={sectionTitle}>Requested new appointment:</Text>
        <Text style={subDetailRow}>
          <strong>Date:</strong> {requestedDate}
        </Text>
        <Text style={subDetailRow}>
          <strong>Time:</strong> {requestedTime}
        </Text>
      </Section>

      <Text style={body}>
        Please review the request and confirm if the new time works for you.
        View your appointments dashboard to accept or reject the reschedule
        request.
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

const sectionTitle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "20px",
  margin: "12px 0 6px",
};

const detailRow: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 4px",
};

const subDetailRow: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 3px",
  paddingLeft: "8px",
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
