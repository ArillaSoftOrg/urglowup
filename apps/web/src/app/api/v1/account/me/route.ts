import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { toAccountDTO } from "@/lib/api/dto";
import { updateProfileSchema } from "@urglowup/validation";
import { updateProfile, deleteAccount } from "@urglowup/domain/accounts";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  return apiOk(toAccountDTO(auth.user));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "account-update",
    subjectId: auth.user.id,
    ipLimit: 20,
    subjectLimit: 10,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be JSON.");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fields[key] = issue.message;
    }
    return apiError("VALIDATION_ERROR", "Invalid profile data.", fields);
  }

  await updateProfile(auth.user.id, {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone ?? null,
  });

  const updated = await getCurrentUser();
  if (!updated) return apiError("UNAUTHORIZED", "Authentication required.");

  return apiOk(toAccountDTO(updated));
}

/**
 * Account deletion (anonymization — see packages/domain/src/accounts/delete-account.ts).
 * Required by both App Store and Play Store review: an in-app deletion path,
 * not just a support-email process.
 */
export async function DELETE() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "account-delete",
    subjectId: auth.user.id,
    ipLimit: 10,
    subjectLimit: 5,
  });
  if (limited) return limited;

  const result = await deleteAccount(auth.user.id);
  if (!result.ok) {
    return apiError("NOT_FOUND", "Account not found.");
  }

  return apiOk({ deleted: true });
}
