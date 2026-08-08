import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { registerDeviceBodySchema } from "@urglowup/validation";
import { registerDevice } from "@urglowup/domain/notifications";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

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
