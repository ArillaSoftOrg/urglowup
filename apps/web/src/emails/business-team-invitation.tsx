import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export interface BusinessTeamInvitationEmailProps {
  businessName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}

export function BusinessTeamInvitationEmail({
  businessName,
  inviterName,
  role,
  acceptUrl,
}: BusinessTeamInvitationEmailProps) {
  const preview = `${inviterName}, ${businessName} ekibine katılmanız için sizi davet etti`;

  return (
    <EmailLayout preview={preview}>
      <Text style={greeting}>Merhaba,</Text>
      <Text style={body}>
        <strong>{inviterName}</strong>, sizi <strong>{businessName}</strong>{" "}
        işletmesinin ekibine <strong>{role}</strong> rolüyle davet etti.
      </Text>

      <Text style={body}>
        Daveti kabul etmek için aşağıdaki butona tıklayın. Bu bağlantı 7 gün
        boyunca geçerlidir.
      </Text>

      <Section style={buttonSection}>
        <Button style={button} href={acceptUrl}>
          Daveti Görüntüle
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
