import { UserRole } from "@/generated/prisma/enums";
import { getActiveBusinessAccess } from "@/lib/auth";
import type { Locale } from "@/lib/i18n-config";

export interface PublicAccountMenuState {
  locale: Locale;
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasBusinessAccess: boolean;
}

export async function getPublicAccountMenuState(
  user: { id: string; role: UserRole } | null,
  locale: Locale = "tr",
): Promise<PublicAccountMenuState> {
  const isAdmin = user?.role === UserRole.ADMIN;
  const businessAccess =
    user && !isAdmin ? await getActiveBusinessAccess(user) : null;

  return {
    locale,
    isLoggedIn: Boolean(user),
    isAdmin,
    hasBusinessAccess: Boolean(businessAccess),
  };
}
