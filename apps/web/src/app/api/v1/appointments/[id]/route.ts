import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { getAppointmentById } from "@urglowup/domain/booking";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await getAppointmentById(auth.user.id, id);
  if (!result.ok) {
    return apiError("NOT_FOUND", "Appointment not found.");
  }

  return apiOk(result.appointment);
}
