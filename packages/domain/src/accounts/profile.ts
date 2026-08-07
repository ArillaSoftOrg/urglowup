import "server-only";
import { db } from "@urglowup/db";

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  phone: string | null;
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || null,
    },
  });
}

/** `locale` is validated by the caller (see apps/web/src/lib/i18n-config.ts). */
export async function updateLocalePreference(userId: string, locale: string): Promise<void> {
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, locale },
    update: { locale },
  });
}
