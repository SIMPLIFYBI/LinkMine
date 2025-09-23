export const runtime = "nodejs";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("service_categories_with_children")
    .select("*")
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  const categories = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    services: Array.isArray(c.services) ? c.services : [],
  }));
  return new Response(JSON.stringify({ ok: true, categories }), { headers: { "content-type": "application/json" } });
}