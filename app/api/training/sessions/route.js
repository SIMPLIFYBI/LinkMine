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
    const includeCompleted = String(url.searchParams.get("includeCompleted") || "false").toLowerCase() === "true";

    const now = new Date();
    const defaultFrom = now.toISOString();
    const defaultTo = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(); // ~6 months

    const sb = await supabaseServerClient();

    // ✅ DEFINE q
    let q = sb
      .from("training_sessions")
      .select(
        `
        id, course_id, starts_at, ends_at, timezone, delivery_method,
        location_name, suburb, state, country,
        join_url, price_cents, currency, gst_included, status,
        course:training_courses ( id, title, slug )
      `
      )
      .gte("starts_at", from || defaultFrom)
      .lte("starts_at", to || defaultTo)
      .order("starts_at", { ascending: true });

    if (!includeCompleted) {
      q = q.eq("status", "scheduled");
    }

    const { data, error } = await q;
    if (error) {
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }

    const sessions = (data || []).map((s) => ({
      id: s.id,
      course_id: s.course_id,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      timezone: s.timezone,
      delivery_method: s.delivery_method,
      location_name: s.location_name,
      suburb: s.suburb,
      state: s.state,
      country: s.country,
      join_url: s.join_url,
      price_cents: s.price_cents,
      currency: s.currency,
      gst_included: s.gst_included,
      status: s.status,

      // back-compat for Timeline rendering
      course: s.course?.title ?? null,
      course_meta: s.course ?? null,
    }));

    return NextResponse.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}