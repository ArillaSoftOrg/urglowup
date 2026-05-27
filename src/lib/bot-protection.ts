const MIN_FORM_FILL_MS = 1500;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

function validatePassiveBotSignals(formData: FormData): string | null {
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot) {
    return "Otomatik gönderimler engellendi.";
  }

  const startedAtRaw = String(formData.get("formStartedAt") ?? "").trim();
  const startedAt = Number(startedAtRaw);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return "Form güvenlik doğrulaması tamamlanamadı. Lütfen tekrar deneyin.";
  }

  if (Date.now() - startedAt < MIN_FORM_FILL_MS) {
    return "Lütfen formu gözden geçirip birkaç saniye sonra tekrar deneyin.";
  }

  return null;
}

async function verifyTurnstile(formData: FormData): Promise<string | null> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const token = String(formData.get("cf-turnstile-response") ?? "").trim();

  if (!secret || !siteKey) {
    if (process.env.NODE_ENV === "production") {
      return "Bot koruması yapılandırılmamış.";
    }
    return null;
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

export async function validateBotProtection(formData: FormData): Promise<string | null> {
  const passiveError = validatePassiveBotSignals(formData);
  if (passiveError) return passiveError;

  return verifyTurnstile(formData);
}
