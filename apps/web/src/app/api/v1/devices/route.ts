import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { registerDeviceBodySchema } from "@urglowup/validation";
import { registerDevice } from "@urglowup/domain/notifications";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "device",
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

  const parsed = registerDeviceBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid device registration.");
  }

  const device = await registerDevice({
    userId: auth.user.id,
    expoPushToken: parsed.data.expoPushToken,
    platform: parsed.data.platform,
  });

  return apiOk(device, 201);
}
