import { Resend } from "resend";
import { env } from "./env";
import type { ReactElement } from "react";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    react,
  });
}
