import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

interface AuthPasswordResetProps {
  resetUrl: string;
}

export function AuthPasswordReset({ resetUrl }: AuthPasswordResetProps) {
  return (
    <EmailLayout preview="UrGlowUp şifre sıfırlama bağlantın">
      <Text style={heading}>Şifreni sıfırla</Text>
      <Text style={body}>
        UrGlowUp hesabın için yeni bir şifre belirlemek üzere aşağıdaki butonu
        kullan.
      </Text>
      <Section style={buttonSection}>
        <Button href={resetUrl} style={button}>
          Yeni şifre oluştur
        </Button>
      </Section>
      <Text style={body}>
        Bu isteği sen yapmadıysan bu e-postayı görmezden gelebilir, hesabını
        kullanmaya devam edebilirsin.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "30px",
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
