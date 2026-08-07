"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { passwordSchema, PASSWORD_GUIDANCE_MESSAGE } from "@/lib/password-policy";
import { db } from "@/lib/db";
import { z } from "zod/v4";
import { cookies } from "next/headers";
import { isValidLocale, type Locale } from "@/lib/i18n-config";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d\s()-]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export type AccountActionState = {
  success: boolean;
  tone?: "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin."),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string().min(1, "Yeni şifre tekrarını girin."),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    path: ["newPasswordConfirm"],
    message: "Şifreler eşleşmiyor.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Yeni şifre mevcut şifrenizden farklı olmalıdır.",
  });

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
  };

  const result = profileSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, errors: fieldErrors };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      phone: result.data.phone || null,
    },
  });

  return { success: true, message: "Profile updated successfully" };
}

export async function updateLocalePreference(locale: Locale): Promise<void> {
  if (!isValidLocale(locale)) return;

  const user = await getCurrentUser();
  if (!user) return;

  await db.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, locale },
    update: { locale },
  });

  const jar = await cookies();
  jar.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
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

function errorState(message: string): AccountActionState {
  return {
    success: false,
    tone: "error",
    message,
  };
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    const code = error.body?.code;

    switch (code) {
      case "CREDENTIAL_ACCOUNT_NOT_FOUND":
        return "Bu hesap bir şifreyle oluşturulmamış.";
      case "INVALID_PASSWORD":
        return "Mevcut şifreniz yanlış. Lütfen tekrar deneyin.";
      case "PASSWORD_TOO_WEAK":
        return PASSWORD_GUIDANCE_MESSAGE;
      case "PASSWORD_TOO_SHORT":
        return "Şifre en az 8 karakter olmalı.";
      case "PASSWORD_TOO_LONG":
        return "Şifre çok uzun.";
      case "SESSION_EXPIRED":
      default:
        return "Şifre güncellenemedi. Lütfen oturumunuzu kapatıp tekrar giriş yapın.";
    }
  }

  return "Şifre güncellenemedi. Lütfen tekrar deneyin.";
}

export async function changePasswordAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return errorState("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    newPasswordConfirm: formData.get("newPasswordConfirm"),
  });

  if (!parsed.success) {
    const errors = flattenErrors(parsed.error);
    if (errors.newPassword) errors.newPassword = PASSWORD_GUIDANCE_MESSAGE;
    return { success: false, tone: "error", errors };
  }

  try {
    const requestHeaders = await headers();
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: requestHeaders,
    });

    return {
      success: true,
      tone: "success",
      message: "Şifreniz başarıyla güncellendi. Diğer oturumlarınız kapatıldı.",
    };
  } catch (error) {
    const message = getAuthErrorMessage(error);

    // Check if it's a field-level error (INVALID_PASSWORD or PASSWORD validation error)
    if (error instanceof APIError) {
      const code = error.body?.code;
      if (code === "INVALID_PASSWORD") {
        return {
          success: false,
          tone: "error",
          errors: { currentPassword: message },
        };
      }
      if (code === "PASSWORD_TOO_WEAK" || code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
        return {
          success: false,
          tone: "error",
          errors: { newPassword: message },
        };
      }
    }

    // Otherwise, it's a general error
    return errorState(message);
  }
}
