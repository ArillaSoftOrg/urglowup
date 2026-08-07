import "server-only";
import { db } from "@urglowup/db";

export interface ToggleFavoriteResult {
  isFavorited: boolean;
}

export async function toggleFavorite(
  userId: string,
  businessId: string,
): Promise<ToggleFavoriteResult> {
  const existing = await db.favorite.findUnique({
    where: { userId_businessId: { userId, businessId } },
    select: { id: true },
  });

  if (existing) {
    await db.favorite.delete({
      where: { userId_businessId: { userId, businessId } },
    });
    return { isFavorited: false };
  }

  await db.favorite.create({
    data: { userId, businessId },
  });
  return { isFavorited: true };
}
