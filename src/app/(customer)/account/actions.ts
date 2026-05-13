"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

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
