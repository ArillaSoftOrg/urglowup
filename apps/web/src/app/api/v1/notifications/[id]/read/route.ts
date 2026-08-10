import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { markNotificationRead } from "@urglowup/domain/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "notification",
    subjectId: auth.user.id,
    ipLimit: 60,
    subjectLimit: 40,
  });
  if (limited) return limited;

  const { id } = await params;
  const result = await markNotificationRead(auth.user.id, id);
  if (!result.ok) {
    return apiError("NOT_FOUND", "Notification not found.");
  }

  return apiOk({ read: true });
}
