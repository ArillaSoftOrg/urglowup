import { maskPhoneForLogging } from "./phone";

export class WhatsAppApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "WhatsAppApiError";
  }
}

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  templateName: string;
  templateLanguage: string;
  isDryRun: boolean;
}

function getWhatsAppConfig(): WhatsAppConfig {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "[whatsapp/client] Missing required env vars: " +
        "WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set.",
    );
  }

  return {
    phoneNumberId,
    accessToken,
    apiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
    templateName:
      process.env.WHATSAPP_TEMPLATE_BOOKING_CONFIRMED ?? "booking_confirmed",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "tr",
    isDryRun: process.env.WHATSAPP_DRY_RUN === "true",
  };
}

async function safeReadErrorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as {
      error?: { message?: string; code?: number };
    };
    if (json.error?.message) return json.error.message;
  } catch {
    // body unreadable
  }
  return `HTTP ${res.status}`;
}

export interface WhatsAppTemplateParams {
  to: string; // E.164 with leading "+"
  customerName: string; // {{1}}
  businessName: string; // {{2}}
  serviceName: string; // {{3}}
  bookingDate: string; // {{4}}
  bookingTime: string; // {{5}}
  businessAddress: string; // {{6}}
}

/**
 * Sends a WhatsApp template message via Meta Business Cloud API.
 *
 * - The "+" is stripped from `to` at payload-build time; the rest of the app
 *   always uses E.164 format with "+".
 * - Dry-run mode logs the payload without calling Meta.
 * - The access token is never included in logs or error messages.
 *
 * @returns The Meta message ID on success.
 * @throws  WhatsAppApiError on non-2xx API responses.
 * @throws  Error if required env vars are absent.
 */
export async function sendWhatsAppTemplateMessage(
  params: WhatsAppTemplateParams,
): Promise<string> {
  const config = getWhatsAppConfig();

  const body = {
    messaging_product: "whatsapp",
    to: params.to.replace(/^\+/, ""), // Meta accepts digits-only international format
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.customerName },
            { type: "text", text: params.businessName },
            { type: "text", text: params.serviceName },
            { type: "text", text: params.bookingDate },
            { type: "text", text: params.bookingTime },
            { type: "text", text: params.businessAddress },
          ],
        },
      ],
    },
  };

  if (config.isDryRun) {
    const logBody = {
      ...body,
      to: maskPhoneForLogging(params.to),
    };
    console.log("[whatsapp] DRY RUN payload:", JSON.stringify(logBody, null, 2));
    return `dry-run-${Date.now()}`;
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await safeReadErrorMessage(res);
    throw new WhatsAppApiError(res.status, message);
  }

  const data = (await res.json()) as { messages: Array<{ id: string }> };
  return data.messages[0].id;
}
