import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
