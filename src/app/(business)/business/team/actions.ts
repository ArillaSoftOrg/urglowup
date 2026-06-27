"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod/v4";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/get-app-url";
import { generateInvitationToken, hashInvitationToken } from "@/lib/invitation-token";
import { generateUniqueProfessionalSlug } from "@/lib/slug";
import { BusinessTeamInvitationEmail } from "@/emails/business-team-invitation";
import { BusinessMemberRole } from "@/generated/prisma/enums";

export type TeamActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ROLE_LABELS: Record<BusinessMemberRole, string> = {
  OWNER: "Sahip",
  MANAGER: "Yönetici",
  STAFF: "Personel",
};

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "E-posta adresi gerekli")
    .email("Geçerli bir e-posta adresi girin"),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]),
});

async function isSoleOwner(businessId: string, role: BusinessMemberRole) {
  if (role !== "OWNER") return false;
  const ownerCount = await db.businessMember.count({
    where: { businessId, role: "OWNER" },
  });
  return ownerCount <= 1;
}

export async function inviteMember(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const { businessId, user } = await requireBusiness("OWNER");

  const result = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { success: false, errors: fieldErrors };
  }

  const { email, role } = result.data;

  const existingMember = await db.businessMember.findFirst({
    where: { businessId, user: { email } },
    select: { id: true },
  });
  if (existingMember) {
    return {
      success: false,
      errors: { email: "Bu e-posta adresi zaten ekibinizde." },
    };
  }

  const business = await db.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { name: true },
  });

  const rawToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  await db.businessInvitation.upsert({
    where: { businessId_email: { businessId, email } },
    create: {
      businessId,
      email,
      role,
      tokenHash,
      invitedBy: user.id,
      expiresAt,
    },
    update: {
      role,
      tokenHash,
      invitedBy: user.id,
      expiresAt,
      acceptedAt: null,
    },
  });

  const acceptUrl = getAppUrl(`/business/invite/${rawToken}`);
  const inviterName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  after(async () => {
    try {
      await sendEmail({
        to: email,
        subject: `${business.name} sizi ekibine davet etti`,
        react: BusinessTeamInvitationEmail({
          businessName: business.name,
          inviterName,
          role: ROLE_LABELS[role],
          acceptUrl,
        }),
        tags: [
          { name: "flow", value: "business" },
          { name: "template", value: "team-invitation" },
        ],
        template: "team-invitation",
      });
    } catch (err) {
      console.error("[email] inviteMember:", err);
    }
  });

  revalidatePath("/business/team");
  return { success: true, message: "Davet gönderildi." };
}

export async function cancelInvitation(
  invitationId: string,
): Promise<TeamActionState> {
  const { businessId } = await requireBusiness("OWNER");

  await db.businessInvitation.deleteMany({
    where: { id: invitationId, businessId, acceptedAt: null },
  });

  revalidatePath("/business/team");
  return { success: true };
}

export async function updateMemberRole(
  memberId: string,
  newRole: BusinessMemberRole,
): Promise<TeamActionState> {
  const { businessId } = await requireBusiness("OWNER");

  const member = await db.businessMember.findFirst({
    where: { id: memberId, businessId },
  });
  if (!member) return { success: false, message: "Üye bulunamadı." };

  if (member.role !== newRole && (await isSoleOwner(businessId, member.role))) {
    return {
      success: false,
      message: "En az bir işletme sahibi gereklidir.",
    };
  }

  await db.businessMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });

  revalidatePath("/business/team");
  return { success: true };
}

export async function removeMember(memberId: string): Promise<TeamActionState> {
  const { businessId } = await requireBusiness("OWNER");

  const member = await db.businessMember.findFirst({
    where: { id: memberId, businessId },
  });
  if (!member) return { success: false, message: "Üye bulunamadı." };

  if (await isSoleOwner(businessId, member.role)) {
    return {
      success: false,
      message: "En az bir işletme sahibi gereklidir.",
    };
  }

  await db.$transaction([
    db.professional.updateMany({
      where: { businessId, userId: member.userId },
      data: { userId: null },
    }),
    db.businessMember.delete({ where: { id: memberId } }),
  ]);

  revalidatePath("/business/team");
  return { success: true };
}

export async function createProfessionalForMember(
  memberId: string,
): Promise<TeamActionState> {
  const { businessId } = await requireBusiness("OWNER");

  const member = await db.businessMember.findFirst({
    where: { id: memberId, businessId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          professional: { select: { id: true, businessId: true } },
        },
      },
    },
  });
  if (!member) return { success: false, message: "Uye bulunamadi." };

  if (member.user.professional) {
    if (member.user.professional.businessId === businessId) {
      return { success: true, message: "Uye zaten profesyonel profile bagli." };
    }
    return {
      success: false,
      message: "Bu kullanici baska bir isletmede profesyonel profile bagli.",
    };
  }

  const displayName =
    [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
    member.user.email.split("@")[0] ||
    "Profesyonel";
  const slug = await generateUniqueProfessionalSlug(displayName);

  await db.professional.create({
    data: {
      businessId,
      userId: member.user.id,
      slug,
      displayName,
      avatarUrl: member.user.avatarUrl,
      isActive: true,
    },
  });

  revalidatePath("/business/team");
  return { success: true, message: "Profesyonel profil olusturuldu." };
}

export async function unlinkProfessionalFromMember(
  memberId: string,
): Promise<TeamActionState> {
  const { businessId } = await requireBusiness("OWNER");

  const member = await db.businessMember.findFirst({
    where: { id: memberId, businessId },
    include: {
      user: {
        select: {
          professional: { select: { id: true, businessId: true } },
        },
      },
    },
  });
  if (!member) return { success: false, message: "Uye bulunamadi." };

  const professional = member.user.professional;
  if (!professional || professional.businessId !== businessId) {
    return { success: false, message: "Bagli profesyonel profil bulunamadi." };
  }

  await db.professional.update({
    where: { id: professional.id },
    data: { userId: null },
  });

  revalidatePath("/business/team");
  return { success: true, message: "Profesyonel baglantisi kaldirildi." };
}
