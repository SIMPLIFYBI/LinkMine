import { gzipSync } from "node:zlib";
import world from "@/lib/intelligence/world-paths.json";

export const runtime = "nodejs";

const json = JSON.stringify(world);
const gzip = gzipSync(json);

export function GET(request) {
  const encoding = request.headers.get("accept-encoding") || "";
  const acceptGzip = /(?:^|,)\s*gzip(?:\s*;\s*q=([01](?:\.\d*)?))?\s*(?:,|$)/i.exec(encoding);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    Vary: "Accept-Encoding",
  };

  if (acceptGzip && Number(acceptGzip[1] ?? 1) > 0) {
    return new Response(gzip, { headers: { ...headers, "Content-Encoding": "gzip" } });
  }
  return new Response(json, { headers });
}
