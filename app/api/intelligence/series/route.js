import { NextResponse } from "next/server";
import { getSeriesRows } from "@/lib/intelligence/published";

export const runtime = "nodejs";

const KEY = /^[a-f0-9]{10}$/;
const VERSION = /^[0-9TZ:+.\-]{0,40}$/;
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

// Published data is licence-cleared and already readable by anyone, so this route is public and cached.
// The caller passes the data's refresh time as `v`, so a refresh changes the URL and no stale copy is served.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const key = params.get("key") || "";
  const version = params.get("v") || "";
  if (!KEY.test(key) || !VERSION.test(version)) return NextResponse.json({ error: "Unknown series." }, { status: 400 });

  const cacheKey = `${key}@${version}`;
  const hit = cache.get(cacheKey);
  let rows = hit && Date.now() - hit.at < TTL_MS ? hit.rows : null;
  if (!rows) {
    try {
      rows = await getSeriesRows(key);
    } catch {
      return NextResponse.json({ error: "Series unavailable." }, { status: 502 });
    }
    cache.set(cacheKey, { at: Date.now(), rows });
  }
  if (!rows.length) return NextResponse.json({ error: "Unknown series." }, { status: 404 });

  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
