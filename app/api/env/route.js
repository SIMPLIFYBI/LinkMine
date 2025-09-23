export const runtime = "nodejs";

export function GET() {
  const hasKey = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  return new Response(JSON.stringify({ hasKey, cwd: process.cwd() }, null, 2), {
    headers: { "content-type": "application/json" },
  });
}