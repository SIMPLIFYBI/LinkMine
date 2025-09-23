// Server-only utility to fetch Place Details (Places API New/v1)
export async function fetchPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { ok: false, error: "Missing GOOGLE_MAPS_API_KEY" };
  if (!placeId) return { ok: false, error: "Missing placeId" };

  // Normalize and build correct path (do NOT encode the slash)
  const id = placeId.replace(/^places\//, "");
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;

  const fieldMask = [
    "rating",
    "userRatingCount",
    "reviews.rating",
    "reviews.text",
    "reviews.publishTime",
    "reviews.authorAttribution.displayName",
    "reviews.authorAttribution.uri",
  ].join(",");

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status}`, debug: { url, fieldMask, body } };
  }

  const json = await res.json();
  return {
    ok: true,
    rating: json.rating ?? null,
    userRatingCount: json.userRatingCount ?? null,
    reviews: Array.isArray(json.reviews) ? json.reviews : [],
  };
}