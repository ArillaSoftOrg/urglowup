"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { z } from "zod/v4";
import { redirect } from "next/navigation";
import { validateBotProtection } from "@/lib/bot-protection";

const onboardingSchema = z.object({
  // Step 1: basics
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.string().min(1, "Please select a category"),
  // Step 2: location & contact
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d\s()-]*$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .max(20)
    .regex(/^[+\d\s()-]*$/, "Invalid WhatsApp number")
    .optional()
    .or(z.literal("")),
  instagramUrl: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  district: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  // Step 3: slug override (optional)
  slugOverride: z.string().max(100).optional().or(z.literal("")),
});

export type OnboardingState = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
};

export async function completeBusinessOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const botProtectionError = await validateBotProtection(formData);
  if (botProtectionError) {
    return { success: false, message: botProtectionError };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  // Check one-business-per-user constraint
  const existing = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (existing) {
    return { success: false, message: "You already have a registered business" };
  }

  const raw: Record<string, string> = {};
  for (const key of [
    "name",
    "description",
    "category",
    "phone",
    "whatsapp",
    "instagramUrl",
    "city",
    "district",
    "address",
    "slugOverride",
  ]) {
    raw[key] = (formData.get(key) as string) ?? "";
  }

  const result = onboardingSchema.safeParse(raw);
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

  const data = result.data;
  const slug = await generateUniqueSlug(data.slugOverride || data.name);

  // Find or create category
  let categoryRecord = await db.businessCategory.findUnique({
    where: { slug: data.category },
  });
  if (!categoryRecord) {
    categoryRecord = await db.businessCategory.create({
      data: {
        name: data.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: data.category,
      },
    });
  }

  // Create business + link category + update user role in a transaction
  await db.$transaction([
    db.business.create({
      data: {
        ownerId: user.id,
        name: data.name,
        slug,
        description: data.description || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        instagramUrl: data.instagramUrl || null,
        city: data.city,
        district: data.district || null,
        address: data.address || null,
        status: "ACTIVE_PRIVATE",
        isMarketplaceVisible: false,
        categories: {
          create: { categoryId: categoryRecord.id },
        },
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: { role: "BUSINESS_OWNER" },
    }),
  ]);

  redirect("/business/dashboard");
}
