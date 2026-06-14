import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { hashPassword } from "better-auth/crypto";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { passwordSchema } from "@/lib/password-policy";
import { UserRole, BusinessMemberRole } from "@/generated/prisma/enums";
import { meetsMinRole } from "./permissions";
import { AuthEmailVerification } from "@/emails/auth-email-verification";
import { AuthPasswordReset } from "@/emails/auth-password-reset";
import { isAdminEmail } from "./admin-bootstrap";
import { db } from "./db";
import { sendEmail } from "./email";
import { env } from "./env";

function resolveTrustedOrigins() {
  const configuredOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [];

  return Array.from(
    new Set(
      [env.NEXT_PUBLIC_APP_URL, env.BETTER_AUTH_URL, ...configuredOrigins]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => new URL(value).origin),
    ),
  );
}

function buildSocialProviders() {
  if (!env.GOOGLE_AUTH_CLIENT_ID || !env.GOOGLE_AUTH_CLIENT_SECRET) {
    return undefined;
  }
  return {
    google: {
      clientId: env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET,
    },
  };
}

export const auth = betterAuth({
  appName: "UrGlowUp",
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: resolveTrustedOrigins(),
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    modelName: "User",
    fields: {
      image: "avatarUrl",
    },
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      serviceAddress: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: true,
        input: false,
        defaultValue: UserRole.CUSTOMER,
      },
    },
  },
  session: {
    modelName: "Session",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "RateLimit",
    window: 60,
    max: 100,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: async (plaintext: string) => {
        const result = passwordSchema.safeParse(plaintext);
        if (!result.success) {
          throw new APIError("BAD_REQUEST", {
            message:
              result.error.issues[0]?.message ??
              "Şifre politika gereksinimlerini karşılamıyor.",
            code: "PASSWORD_TOO_WEAK",
          });
        }
        return hashPassword(plaintext);
      },
    },
    sendResetPassword: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        subject: "UrGlowUp sifre sifirlama baglantin",
        react: React.createElement(AuthPasswordReset, { resetUrl: url }),
        tags: [
          { name: "flow", value: "auth" },
          { name: "template", value: "password-reset" },
        ],
        template: "password-reset",
      });

      if (!result.success) {
        console.error("[auth:password-reset-email-failed]", {
          userId: user.id,
          email: user.email,
          errorType: result.errorType,
          errorMessage: result.error,
        });
        // Don't throw — let the reset token be created anyway.
        // Better to have a reset token than to fail the entire request.
      }
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        subject: "UrGlowUp hesabini dogrula",
        react: React.createElement(AuthEmailVerification, {
          verificationUrl: url,
        }),
        tags: [
          { name: "flow", value: "auth" },
          { name: "template", value: "email-verification" },
        ],
        template: "email-verification",
      });

      if (!result.success) {
        console.error("[auth:verification-email-failed]", {
          userId: user.id,
          email: user.email,
          errorType: result.errorType,
          errorMessage: result.error,
        });
        // Don't throw — let the account be created anyway.
        // The user can use "resend verification email" later.
      }
    },
  },
  advanced: {
    cookiePrefix: "urglowup",
    trustedProxyHeaders: true,
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      ipv6Subnet: 64,
    },
  },
  socialProviders: buildSocialProviders(),
  plugins: [
    twoFactor({
      issuer: env.TOTP_ISSUER,
      skipVerificationOnEnable: false,
      twoFactorCookieMaxAge: 600,
      backupCodeOptions: {
        amount: 10,
      },
    }),
    nextCookies(),
  ],
});

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentUser() {
  const session = await getSession();
  const sessionUser = session?.user;

  if (!sessionUser) {
    return null;
  }

  let user = await db.user.findUnique({
    where: { id: sessionUser.id },
  });

  if (!user) {
    return null;
  }

  if (isAdminEmail(user.email) && user.role !== UserRole.ADMIN) {
    user = await db.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== role) {
    redirect("/");
  }

  return user;
}

export async function requireBusiness(
  minRole: BusinessMemberRole = BusinessMemberRole.STAFF,
) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const member = await db.businessMember.findFirst({
    where: { userId: user.id },
    select: { businessId: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  // Legacy fallback: original BUSINESS_OWNER whose member row may not exist yet
  if (!member && user.role === UserRole.BUSINESS_OWNER) {
    const biz = await db.business.findUnique({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (!biz) redirect("/business/onboarding");
    return { user, businessId: biz.id, memberRole: BusinessMemberRole.OWNER };
  }

  if (!member) redirect("/auth/login");

  if (!meetsMinRole(member.role, minRole)) redirect("/business/dashboard");

  return { user, businessId: member.businessId, memberRole: member.role };
}

export async function requireAdminMfa() {
  const user = await requireRole(UserRole.ADMIN);

  if (!user.twoFactorEnabled) {
    redirect("/admin/mfa/setup");
  }

  return user;
}
