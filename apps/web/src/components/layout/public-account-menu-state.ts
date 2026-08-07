import { UserRole } from "@/generated/prisma/enums";
import { getActiveBusinessAccess } from "@/lib/auth";
import type { Locale } from "@/lib/i18n-config";

export interface PublicAccountMenuState {
  locale: Locale;
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasBusinessAccess: boolean;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

type MenuUser = {
  id: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export async function getPublicAccountMenuState(
  user: MenuUser | null,
  locale: Locale = "tr",
): Promise<PublicAccountMenuState> {
  const isAdmin = user?.role === UserRole.ADMIN;
  const businessAccess =
    user && !isAdmin ? await getActiveBusinessAccess(user) : null;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  return {
    locale,
    isLoggedIn: Boolean(user),
    isAdmin,
    hasBusinessAccess: Boolean(businessAccess),
    name,
    email: user?.email ?? null,
    avatarUrl: user?.avatarUrl ?? null,
  };
}
