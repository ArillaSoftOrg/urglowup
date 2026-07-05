import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod/v4";

const requestSchema = z.object({
  fileType: z.enum(["image", "video"]),
});

export async function POST(request: Request) {
  let businessId: string;
  try {
    const result = await requireBusiness();
    businessId = result.businessId;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    scope: "media-sign",
    headers: request.headers,
    subjectId: businessId,
    ipLimit: 120,
    subjectLimit: 60,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: rateLimit.message },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { fileType } = parsed.data;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `urglowup/${businessId}/posts`;

  const { signature, apiKey, cloudName } = generateUploadSignature({
    folder,
    timestamp,
    resource_type: fileType,
  });

  return NextResponse.json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    resourceType: fileType,
  });
}
