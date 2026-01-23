import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

function asIsoOrNull(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const from = asIsoOrNull(url.searchParams.get("from"));
    const to = asIsoOrNull(url.searchParams.get("to"));

    const sb = await supabaseServerClient();

    let q = sb
      .from("events")
      .select(
        "id,title,summary,description,starts_at,ends_at,timezone,delivery_method,location_name,suburb,state,country,join_url,external_url,organizer_name,organizer_url,tags,status"
      )
      .eq("status", "published")
      .order("starts_at", { ascending: true });

    if (from) q = q.gte("starts_at", from);
    if (to) q = q.lte("starts_at", to);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}