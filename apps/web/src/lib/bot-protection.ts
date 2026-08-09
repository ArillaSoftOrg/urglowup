import { env } from "@/lib/env";

const MIN_FORM_FILL_MS = 1500;
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

type BotProtectionOptions = {
  minimumFillMs?: number;
};

function validatePassiveBotSignals(
  formData: FormData,
  minimumFillMs: number,
): string | null {
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot) {
    return "Otomatik gönderimler engellendi.";
  }

  const startedAtRaw = String(formData.get("formStartedAt") ?? "").trim();
  const startedAt = Number(startedAtRaw);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return "Form güvenlik doğrulaması tamamlanamadı. Lütfen tekrar deneyin.";
  }

  if (minimumFillMs > 0 && Date.now() - startedAt < minimumFillMs) {
    return "Lütfen formu gözden geçirip birkaç saniye sonra tekrar deneyin.";
  }

  return null;
}

async function verifyTurnstile(formData: FormData): Promise<string | null> {
  const secret = env.TURNSTILE_SECRET_KEY;
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const token = String(formData.get("cf-turnstile-response") ?? "").trim();

  if (!secret && !siteKey) {
    return null;
  }

  if (!secret || !siteKey) {
    return "Bot koruması eksik yapılandırılmış. Lütfen sayfayı yenileyip tekrar deneyin.";
  }

  if (!token) {
    return "Lütfen bot doğrulamasını tamamlayın.";
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      return "Bot doğrulaması kontrol edilemedi. Lütfen tekrar deneyin.";
    }

    const result = (await response.json()) as TurnstileVerifyResponse;
    if (!result.success) {
      return "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin.";
    }

    return null;
  } catch {
    return "Bot doğrulaması kontrol edilemedi. Lütfen tekrar deneyin.";
  }
}

export async function validateBotProtection(
  formData: FormData,
  options: BotProtectionOptions = {},
): Promise<string | null> {
  const passiveError = validatePassiveBotSignals(
    formData,
    options.minimumFillMs ?? MIN_FORM_FILL_MS,
  );
  if (passiveError) {
    return passiveError;
  }

  return verifyTurnstile(formData);
}
