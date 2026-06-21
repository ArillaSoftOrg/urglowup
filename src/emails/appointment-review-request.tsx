import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface AppointmentReviewRequestEmailProps {
  customerName: string;
  businessName: string;
  serviceName: string;
  reviewUrl: string;
}

export function AppointmentReviewRequestEmail({
  customerName,
  businessName,
  serviceName,
  reviewUrl,
}: AppointmentReviewRequestEmailProps) {
  const preview = `${businessName} deneyiminizi değerlendirin`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Merhaba {customerName},</Text>
      <Text style={body}>
        <strong>{businessName}</strong> işletmesinde aldığınız <strong>{serviceName}</strong> hizmetini
        nasıl buldunuz? Yorumunuz diğer müşterilere yol gösteriyor.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={reviewUrl}>
          Yorum yaz
        </Button>
      </Section>

      <Text style={footer}>
        Yalnızca tamamlanan randevular için yorum yazabilirsiniz.
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
  margin: "24px 0",
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

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};
