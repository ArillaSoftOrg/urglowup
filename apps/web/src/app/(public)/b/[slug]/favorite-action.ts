"use server";

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { toggleFavorite as toggleFavoriteForUser } from "@urglowup/domain/favorites";

export async function toggleFavorite(businessId: string): Promise<{ isFavorited: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return toggleFavoriteForUser(user.id, businessId);
}
