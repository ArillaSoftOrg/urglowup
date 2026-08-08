import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { removeDevice } from "@urglowup/domain/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await removeDevice(auth.user.id, id);
  if (!result.ok) {
    return apiError("NOT_FOUND", "Device not found.");
  }

  return apiOk({ removed: true });
}
