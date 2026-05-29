import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface MarketingEmailProps {
  preview: string;
  subject: string;
  unsubscribeUrl: string;
  children: React.ReactNode;
}

export function MarketingEmail({
  preview,
  unsubscribeUrl,
  children,
}: MarketingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>UrGlowUp</Text>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} UrGlowUp. Tüm hakları saklıdır.
            </Text>
            <Text style={unsubscribeText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Bu e-postayı almak istemiyorum
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#18181b",
  padding: "24px 32px",
};

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: 0,
};

const content: React.CSSProperties = {
  padding: "32px",
};

const hr: React.CSSProperties = {
  borderColor: "#e4e4e7",
  margin: "0 32px",
};

const footer: React.CSSProperties = {
  padding: "20px 32px 24px",
};

const footerText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 4px",
};

const unsubscribeText: React.CSSProperties = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0 0",
};

const unsubscribeLink: React.CSSProperties = {
  color: "#3b82f6",
  textDecoration: "underline",
};
