export const runtime = "nodejs";

export async function GET() {
  // Replace with Supabase later
  const now = Date.now();
  const twoHours = 2 * 3600e3;
  return new Response(
    JSON.stringify({
      sessions: [
        { id: "m1", provider: "ACME Training", course: "Confined Spaces", location: "Perth", starts_at: new Date(now + 3600e3).toISOString(), ends_at: new Date(now + 3600e3 + twoHours).toISOString() },
        { id: "m2", provider: "OreLearn", course: "Mine Safety Induction", location: "Brisbane", starts_at: new Date(now + 86400e3).toISOString(), ends_at: new Date(now + 86400e3 + twoHours).toISOString() },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}