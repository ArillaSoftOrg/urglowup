import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { env } from "./env";
import {
  diagnoseResendError,
  logEmailEvent,
  type EmailFailureType,
} from "./email-diagnostics";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

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
  template?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  tags,
  template,
}: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  errorType?: EmailFailureType;
}> {
  logEmailEvent({
    type: "send_attempt",
    to,
    subject,
    template,
  });

  try {
    const client = getResendClient();
    if (!client) {
      const message = "RESEND_API_KEY is not configured";
      logEmailEvent({
        type: "send_failure",
        to,
        subject,
        template,
        errorType: "MISSING_ENV",
        errorMessage: message,
      });
      return {
        success: false,
        error: message,
        errorType: "MISSING_ENV",
      };
    }

    const html = await render(react);

    const response = await client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      replyTo: replyTo ?? env.EMAIL_REPLY_TO,
      tags,
    });

    if (response.error) {
      const diagnosis = diagnoseResendError(response.error);

      logEmailEvent({
        type: "send_failure",
        to,
        subject,
        template,
        errorType: diagnosis.type,
        errorMessage: diagnosis.message,
      });

      return {
        success: false,
        error: diagnosis.message,
        errorType: diagnosis.type,
      };
    }

    logEmailEvent({
      type: "send_success",
      to,
      subject,
      template,
      resendMessageId: response.data?.id,
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    const diagnosis = diagnoseResendError(error);

    logEmailEvent({
      type: "send_failure",
      to,
      subject,
      template,
      errorType: diagnosis.type,
      errorMessage: diagnosis.message,
    });

    return {
      success: false,
      error: diagnosis.message,
      errorType: diagnosis.type,
    };
  }
}
