import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    scope: "media-sign",
    headers: request.headers,
    subjectId: user.id,
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

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "urglowup/categories";

  const { signature, apiKey, cloudName } = generateUploadSignature({
    folder,
    timestamp,
    resource_type: "image",
  });

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
