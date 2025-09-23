export const runtime = "nodejs";
import { fetchPlaceDetails } from "@/lib/googlePlaces";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId") || "";
  const result = await fetchPlaceDetails(placeId);
  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}