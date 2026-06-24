"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function toggleFavorite(businessId: string): Promise<{ isFavorited: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const existing = await db.favorite.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
    select: { id: true },
  });

  if (existing) {
    await db.favorite.delete({
      where: { userId_businessId: { userId: user.id, businessId } },
    });
    return { isFavorited: false };
  }

  await db.favorite.create({
    data: { userId: user.id, businessId },
  });
  return { isFavorited: true };
}
