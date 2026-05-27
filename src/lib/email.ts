import { Resend } from "resend";
import type { ReactElement } from "react";
import { env } from "./env";

const resend = new Resend(env.RESEND_API_KEY);

interface EmailTag {
  name: string;
  value: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
  tags?: EmailTag[];
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  tags,
}: SendEmailOptions): Promise<void> {
  const response = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    react,
    replyTo: replyTo ?? env.EMAIL_REPLY_TO,
    tags,
  });

  if (response.error) {
    console.error("[email] Failed to send email", {
      to,
      subject,
      error: response.error,
    });

    throw new Error(`Failed to send email: ${subject}`);
  }
}
