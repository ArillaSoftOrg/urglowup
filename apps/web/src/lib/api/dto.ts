import type { getCurrentUser } from "@/lib/auth";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Never return the raw User row — strips internal/sensitive fields. */
export function toAccountDTO(user: CurrentUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  };
}
