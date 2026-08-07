import { db } from "./db";
import type { UserPreferencesModel as UserPreferences } from "@/generated/prisma/models";

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  return db.userPreferences.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}
