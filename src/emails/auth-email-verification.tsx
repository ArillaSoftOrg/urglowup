import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

interface AuthEmailVerificationProps {
  verificationUrl: string;
}

export function AuthEmailVerification({
  verificationUrl,
}: AuthEmailVerificationProps) {
  return (
    <EmailLayout preview="UrGlowUp hesabını doğrula">
      <Text style={heading}>Hesabını doğrula</Text>
      <Text style={body}>
        UrGlowUp hesabını etkinleştirmek için aşağıdaki butona tıkla.
      </Text>
      <Section style={buttonSection}>
        <Button href={verificationUrl} style={button}>
          E-posta adresimi doğrula
        </Button>
      </Section>
      <Text style={body}>
        Bu isteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.
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
