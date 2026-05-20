import { db } from "@/lib/db";

const GEOCODING_API = "https://maps.googleapis.com/maps/api/geocode/json";

export async function geocodeBusinessAddress(
  businessId: string,
  address: string
): Promise<void> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) return;

  await db.business.update({
    where: { id: businessId },
    data: { geocodingStatus: "PENDING", geocodedAt: new Date() },
  });

  let res: Response;
  try {
    res = await fetch(
      `${GEOCODING_API}?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
  } catch (err) {
    await db.business.update({
      where: { id: businessId },
      data: {
        geocodingStatus: "FAILED",
        geocodingError: err instanceof Error ? err.message : "Network error",
      },
    });
    return;
  }

  let json: { status: string; results: Array<{ geometry: { location: { lat: number; lng: number } } }> };
  try {
    json = await res.json();
  } catch {
    await db.business.update({
      where: { id: businessId },
      data: { geocodingStatus: "FAILED", geocodingError: "Invalid API response" },
    });
    return;
  }

  if (json.status === "OK" && json.results.length > 0) {
    const { lat, lng } = json.results[0].geometry.location;
    await db.business.update({
      where: { id: businessId },
      data: {
        latitude: lat,
        longitude: lng,
        geocodingStatus: "SUCCESS",
        geocodingError: null,
        geocodedAt: new Date(),
      },
    });
  } else {
    await db.business.update({
      where: { id: businessId },
      data: {
        geocodingStatus: "FAILED",
        geocodingError: json.status ?? "No results",
      },
    });
  }
}
