"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  buildVerificationCallbackURL,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";
import {
  enforceForgotPasswordRateLimit,
  enforceLoginRateLimit,
  enforceVerificationEmailRateLimit,
} from "@/lib/auth-rate-limit";
import { validateBotProtection } from "@/lib/bot-protection";

type AuthMessageTone = "success" | "error" | "info";

export type AuthFormState = {
  success: boolean;
  message?: string;
  tone?: AuthMessageTone;
  errors?: Record<string, string>;
};

const loginSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifrenizi girin."),
  redirectTo: z.string().optional(),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Ad soyad en az 2 karakter olmalı."),
    email: z.email("Geçerli bir e-posta adresi girin."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
    passwordConfirm: z.string().min(8, "Şifre tekrarını girin."),
    redirectTo: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Şifreler eşleşmiyor.",
  });

const forgotPasswordSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  redirectTo: z.string().optional(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Bağlantı artık geçerli değil."),
    newPassword: z.string().min(8, "Şifre en az 8 karakter olmalı."),
    passwordConfirm: z.string().min(8, "Şifre tekrarını girin."),
    redirectTo: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Şifreler eşleşmiyor.",
  });

const resendVerificationSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin."),
  redirectTo: z.string().optional(),
});

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      success: false,
      tone: "error",
      errors: flattenErrors(parsed.error),
    };
  }

  const botError = await validateBotProtection(formData);
  if (botError) {
    return errorState(botError);
  }

  const requestHeaders = await headers();
  const rateLimit = await enforceLoginRateLimit(
    requestHeaders,
    parsed.data.email,
  );
  if (!rateLimit.ok) {
    return errorState(rateLimit.message);
  }

  const redirectTo = normalizeAuthRedirect(parsed.data.redirectTo);

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: redirectTo,
      },
      headers: requestHeaders,
    });
  } catch (error) {
    if (isAuthErrorCode(error, "EMAIL_NOT_VERIFIED")) {
      const resent = await resendVerificationEmail(
        parsed.data.email,
        redirectTo,
        requestHeaders,
      );

      return {
        success: false,
        tone: "info",
        message: resent
          ? "E-posta adresiniz henüz doğrulanmadı. Yeni bir doğrulama bağlantısı gönderdik. Gelen kutunuzu ve spam klasörünüzü kontrol edin."
          : "E-posta adresiniz henüz doğrulanmadı. Yakın zamanda doğrulama bağlantısı gönderildiği için şu an yeni e-posta gönderemedik. Gelen kutunuzu kontrol edin.",
      };
    }

    return mapAuthError(error, "signIn");
  }

  redirect(redirectTo);
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      success: false,
      tone: "error",
      errors: flattenErrors(parsed.error),
    };
  }

  const { firstName, lastName } = splitName(parsed.data.name);
  const requestHeaders = await headers();
  const redirectTo = normalizeAuthRedirect(parsed.data.redirectTo);

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        firstName,
        lastName,
        callbackURL: buildVerificationCallbackURL(redirectTo),
      },
      headers: requestHeaders,
    });
  } catch (error) {
    return mapAuthError(error, "signUp");
  }

  return {
    success: true,
    tone: "success",
    message:
      "Hesabınız oluşturuldu. Devam etmek için doğrulama e-postasını açın. E-posta birkaç dakika içinde gelmezse spam klasörünü kontrol edin.",
  };
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      success: false,
      tone: "error",
      errors: flattenErrors(parsed.error),
    };
  }

  const botError = await validateBotProtection(formData);
  if (botError) {
    return errorState(botError);
  }

  const requestHeaders = await headers();
  const rateLimit = await enforceForgotPasswordRateLimit(
    requestHeaders,
    parsed.data.email,
  );
  if (!rateLimit.ok) {
    return errorState(rateLimit.message);
  }

  try {
    const redirectTo = normalizeAuthRedirect(parsed.data.redirectTo);
    const resetRedirect =
      redirectTo === "/account"
        ? "/reset-password"
        : `/reset-password?next=${encodeURIComponent(redirectTo)}`;

    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: resetRedirect,
      },
      headers: requestHeaders,
    });
  } catch (error) {
    return mapAuthError(error, "forgotPassword");
  }

  return {
    success: true,
    tone: "success",
    message:
      "Talebini aldık. Bu adresle eşleşen bir hesap varsa şifre sıfırlama bağlantısını gönderdik.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    passwordConfirm: formData.get("passwordConfirm"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      success: false,
      tone: "error",
      errors: flattenErrors(parsed.error),
    };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token: parsed.data.token,
        newPassword: parsed.data.newPassword,
      },
      headers: await headers(),
    });
  } catch (error) {
    return mapAuthError(error, "resetPassword");
  }

  const redirectTo = normalizeAuthRedirect(parsed.data.redirectTo);
  const loginUrl =
    redirectTo === "/account"
      ? "/login?reset=success"
      : `/login?reset=success&redirect_url=${encodeURIComponent(redirectTo)}`;

  redirect(loginUrl);
}

export async function resendVerificationAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      success: false,
      tone: "error",
      errors: flattenErrors(parsed.error),
    };
  }

  const botError = await validateBotProtection(formData);
  if (botError) {
    return errorState(botError);
  }

  const requestHeaders = await headers();
  const rateLimit = await enforceVerificationEmailRateLimit(
    requestHeaders,
    parsed.data.email,
  );
  if (!rateLimit.ok) {
    return errorState(rateLimit.message);
  }

  try {
    await auth.api.sendVerificationEmail({
      body: {
        email: parsed.data.email,
        callbackURL: buildVerificationCallbackURL(parsed.data.redirectTo),
      },
      headers: requestHeaders,
    });
  } catch (error) {
    return mapAuthError(error, "verification");
  }

  return {
    success: true,
    tone: "success",
    message:
      "Eğer bu e-posta adresi doğrulanmamış bir hesaba aitse, yeni doğrulama bağlantısı gönderildi.",
  };
}

export async function signInWithGoogleAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const redirectTo = normalizeAuthRedirect(
    formData.get("redirectTo")?.toString(),
  );

  let oauthUrl: string | undefined;
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: redirectTo,
        errorCallbackURL: "/login",
        disableRedirect: true,
      },
      headers: await headers(),
    });
    oauthUrl = result.url;
  } catch {
    return errorState(
      "Google ile giriş şu anda başlatılamıyor. Lütfen e-posta ile giriş yapın.",
    );
  }

  if (oauthUrl) {
    redirect(oauthUrl);
  }

  return errorState("Google OAuth başlatılamadı. Lütfen tekrar deneyin.");
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
}

function flattenErrors(error: z.ZodError) {
  const fieldErrors = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([key, messages]) => {
      const first = messages?.[0];
      return first ? [[key, first]] : [];
    }),
  );
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

function errorState(message: string): AuthFormState {
  return {
    success: false,
    tone: "error",
    message,
  };
}

function mapAuthError(
  error: unknown,
  context:
    | "signIn"
    | "signUp"
    | "forgotPassword"
    | "resetPassword"
    | "verification",
): AuthFormState {
  const details = getAuthErrorDetails(error);

  if (
    details.message?.toLowerCase().includes("too many requests") ||
    details.code === "TOO_MANY_REQUESTS"
  ) {
    return errorState(
      "Çok fazla istek alındı. Lütfen birkaç dakika sonra tekrar deneyin.",
    );
  }

  switch (details.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return errorState("E-posta adresi veya şifre hatalı.");
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return errorState("Bu e-posta adresiyle kayıtlı bir hesap zaten var.");
    case "PASSWORD_TOO_SHORT":
      return errorState("Şifre en az 8 karakter olmalı.");
    case "PASSWORD_TOO_LONG":
      return errorState("Şifre çok uzun. Daha kısa bir şifre deneyin.");
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return errorState(
        "Bağlantı artık geçerli değil. Güvenliğiniz için yeni bir bağlantı isteyin.",
      );
    case "INVALID_ORIGIN":
    case "INVALID_CALLBACK_URL":
    case "MISSING_OR_NULL_ORIGIN":
    case "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED":
      return errorState(
        "İstek güvenlik doğrulamasını geçemedi. Sayfayı yenileyip tekrar deneyin.",
      );
    case "EMAIL_ALREADY_VERIFIED":
      return {
        success: false,
        tone: "info",
        message: "Bu e-posta adresi zaten doğrulanmış. Giriş yapabilirsiniz.",
      };
    case "EMAIL_NOT_VERIFIED":
      return {
        success: false,
        tone: "info",
        message:
          "E-posta adresiniz henüz doğrulanmadı. Doğrulama bağlantısı için gelen kutunuzu kontrol edin.",
      };
  }

  switch (context) {
    case "signIn":
      return errorState(
        "Giriş yapılamadı. Bilgilerinizi kontrol edip tekrar deneyin.",
      );
    case "signUp":
      return errorState("Hesap oluşturulamadı. Lütfen tekrar deneyin.");
    case "forgotPassword":
      return errorState(
        "Şifre sıfırlama isteği şu anda tamamlanamıyor. Lütfen daha sonra tekrar deneyin.",
      );
    case "verification":
      return errorState(
        "Doğrulama e-postası şu anda gönderilemiyor. Lütfen daha sonra tekrar deneyin.",
      );
    case "resetPassword":
      return errorState(
        "Şifre güncellenemedi. Yeni bir bağlantı isteyip tekrar deneyin.",
      );
  }
}

function getAuthErrorDetails(error: unknown) {
  if (error instanceof APIError) {
    return {
      code: error.body?.code,
      message: error.body?.message,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "body" in error &&
    typeof error.body === "object" &&
    error.body !== null
  ) {
    const body = error.body as { code?: string; message?: string };
    return {
      code: body.code,
      message: body.message,
    };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return {
      code: undefined,
      message: error.message,
    };
  }

  return {
    code: undefined,
    message: undefined,
  };
}

function isAuthErrorCode(error: unknown, code: string) {
  return getAuthErrorDetails(error).code === code;
}

async function resendVerificationEmail(
  email: string,
  redirectTo: string,
  requestHeaders: Awaited<ReturnType<typeof headers>>,
) {
  const rateLimit = await enforceVerificationEmailRateLimit(
    requestHeaders,
    email,
  );
  if (!rateLimit.ok) {
    return false;
  }

  try {
    await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: buildVerificationCallbackURL(redirectTo),
      },
      headers: requestHeaders,
    });

    return true;
  } catch {
    return false;
  }
}
