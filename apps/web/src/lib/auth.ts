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
import { UserRole, BusinessMemberRole, MembershipStatus } from "@/generated/prisma/enums";
import { meetsMinRole } from "@urglowup/domain";
import { AuthEmailVerification } from "@/emails/auth-email-verification";
import { AuthPasswordReset } from "@/emails/auth-password-reset";
import { isAdminEmail } from "./admin-bootstrap";
import {
  logAuthEvent,
  maskEmailForLog,
  redactAuthUrlForLog,
} from "./auth-security";
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
    resetPasswordTokenExpiresIn: 60 * 60,
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
      logAuthEvent("info", "auth.email_send_attempt", {
        flow: "password_reset",
        userId: user.id,
        email: maskEmailForLog(user.email),
        resetUrl: redactAuthUrlForLog(url),
      });

      const result = await sendEmail({
        to: user.email,
        subject: "UrGlowUp şifre sıfırlama bağlantısı",
        react: React.createElement(AuthPasswordReset, { resetUrl: url }),
        tags: [
          { name: "flow", value: "auth" },
          { name: "template", value: "password-reset" },
        ],
        template: "password-reset",
      });

      if (!result.success) {
        logAuthEvent("error", "auth.email_failed", {
          flow: "password_reset",
          userId: user.id,
          email: maskEmailForLog(user.email),
          errorType: result.errorType,
          errorMessage: result.error,
          resetUrl: redactAuthUrlForLog(url),
        });
        // Don't throw — let the reset token be created anyway.
        // Better to have a reset token than to fail the entire request.
      } else {
        logAuthEvent("info", "auth.email_sent", {
          flow: "password_reset",
          userId: user.id,
          email: maskEmailForLog(user.email),
          messageId: result.messageId,
        });
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
        logAuthEvent("error", "auth.email_failed", {
          flow: "email_verification",
          userId: user.id,
          email: maskEmailForLog(user.email),
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

/**
 * Resolves a user's active business access that satisfies `minRole`.
 * Primary source: BusinessMember(status=ACTIVE) whose role meets minRole.
 * Legacy fallback: Business.ownerId (OWNER meets any minRole).
 * Returns null when no active membership meets minRole and no legacy ownership.
 */
export async function getActiveBusinessAccess(
  user: { id: string; role: UserRole },
  minRole: BusinessMemberRole = BusinessMemberRole.STAFF,
): Promise<{ businessId: string; memberRole: BusinessMemberRole } | null> {
  const members = await db.businessMember.findMany({
    where: { userId: user.id, status: MembershipStatus.ACTIVE },
    select: { businessId: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  // First ACTIVE membership that meets minRole (handles STAFF@A + OWNER@B).
  const match = members.find((m) => meetsMinRole(m.role, minRole));
  if (match) return { businessId: match.businessId, memberRole: match.role };

  // Legacy fallback: original BUSINESS_OWNER whose member row may not exist yet.
  if (user.role === UserRole.BUSINESS_OWNER) {
    const biz = await db.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (biz) return { businessId: biz.id, memberRole: BusinessMemberRole.OWNER };
  }

  return null;
}

export async function requireBusiness(
  minRole: BusinessMemberRole = BusinessMemberRole.STAFF,
) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const access = await getActiveBusinessAccess(user, minRole);
  if (access) {
    return { user, businessId: access.businessId, memberRole: access.memberRole };
  }

  // No access meeting minRole. Does the user have a lower-role business?
  // Preserve existing behavior: insufficient role → /business/dashboard.
  if (minRole !== BusinessMemberRole.STAFF) {
    const anyAccess = await getActiveBusinessAccess(user);
    if (anyAccess) redirect("/business/dashboard");
  }

  if (user.role === UserRole.BUSINESS_OWNER) redirect("/business/onboarding");
  redirect("/auth/login");
}

export async function requireAdminMfa() {
  const user = await requireAdminRole();

  if (!user.twoFactorEnabled) {
    redirect("/admin/mfa/setup");
  }

  // Defense-in-depth: confirm a verified TOTP record actually exists in the DB.
  // This catches the degenerate case where twoFactorEnabled=true on the User row
  // but no TwoFactor secret was ever enrolled (e.g. a manual DB edit).
  const tfRecord = await db.twoFactor.findUnique({ where: { userId: user.id } });
  if (!tfRecord || !tfRecord.verified) {
    redirect("/admin/mfa/setup");
  }

  // Session-level guarantee: better-auth's two-factor plugin intercepts
  // /sign-in/email, deletes the session created by the credential check, and
  // only issues a new session token AFTER the TOTP code is accepted. This means
  // any live session for an email-password admin necessarily passed TOTP.
  //
  // Google OAuth is explicitly disabled on the admin login page to close the
  // social-sign-in bypass (the 2FA hook only fires for /sign-in/email, not
  // /sign-in/social). Do not re-enable it without adding social-sign-in 2FA.

  return user;
}

export async function requireAdminRole() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return user;
}
