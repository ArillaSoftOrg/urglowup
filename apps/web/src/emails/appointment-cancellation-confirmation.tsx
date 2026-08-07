import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentCancellationConfirmationEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  dashboardUrl: string;
}

export function AppointmentCancellationConfirmationEmail({
  customerName,
  businessName,
  serviceName,
  requestedDate,
  requestedTime,
  dashboardUrl,
}: AppointmentCancellationConfirmationEmailProps) {
  const preview = `Your appointment at ${businessName} has been cancelled`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Merhaba {customerName || "there"},</Text>
      <Text style={body}>
        Randevunuz <strong>{businessName}</strong> ile iptal edilmiştir.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailRow}>
          <strong>İşletme:</strong> {businessName}
        </Text>
        <Text style={detailRow}>
          <strong>Hizmet:</strong> {serviceName}
        </Text>
        <Text style={detailRow}>
          <strong>Tarih:</strong> {requestedDate}
        </Text>
        <Text style={detailRow}>
          <strong>Saat:</strong> {requestedTime}
        </Text>
      </Section>

      <Text style={body}>
        İptal işlemi tamamlandı. Randevularınızı yönetmek için hesabınıza giriş yapabilirsiniz.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={dashboardUrl}>
          Randevularımı Görüntüle
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
