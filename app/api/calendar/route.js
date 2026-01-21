import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseTypes(v) {
  const raw = String(v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const set = new Set(raw);
  const allow = new Set(["event", "training"]);
  const out = [...set].filter((t) => allow.has(t));
  return out.length ? out : ["event", "training"];
}

function normalizeRegion(v) {
  const r = String(v || "ALL").toUpperCase();
  return r === "AU" || r === "INTL" || r === "ALL" ? r : "ALL";
}

function parseIsoOrNull(v) {
  if (!v) return null;
  const s = String(v);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? s : null;
}

function applyRegionFilter(q, region) {
  if (region === "ALL") return q;
  if (region === "AU") return q.eq("country", "AU");
  return q.not("country", "is", null).neq("country", "AU"); // INTL
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const types = parseTypes(searchParams.get("types"));
    const region = normalizeRegion(searchParams.get("region"));
    const from = parseIsoOrNull(searchParams.get("from"));
    const to = parseIsoOrNull(searchParams.get("to"));

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing or invalid 'from'/'to' ISO params." },
        { status: 400 }
      );
    }

    const sb = getSupabase();
    const results = [];

    if (types.includes("event")) {
      let q = sb
        .from("events")
        .select(
          "id,title,summary,description,starts_at,ends_at,timezone,delivery_method,location_name,suburb,state,postcode,country,join_url,external_url,organizer_name,organizer_url,tags,status,created_by"
        )
        .eq("status", "published")
        .gte("starts_at", from)
        .lt("starts_at", to);

      q = applyRegionFilter(q, region);

      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      for (const row of data || []) {
        if (!row?.id || !UUID_RE.test(String(row.id))) continue;
        results.push({
          id: `event-${row.id}`,
          type: "event",
          event_id: row.id,
          title: row.title,
          summary: row.summary,
          description: row.description,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          timezone: row.timezone,
          delivery_method: row.delivery_method,
          location_name: row.location_name,
          suburb: row.suburb,
          state: row.state,
          postcode: row.postcode,
          country: row.country,
          join_url: row.join_url,
          external_url: row.external_url,
          organizer_name: row.organizer_name,
          organizer_url: row.organizer_url,
          tags: row.tags ?? [],
          created_by: row.created_by ?? null,
        });
      }
    }

    if (types.includes("training")) {
      let q = sb
        .from("training_sessions")
        .select(
          `
          id,
          course_id,
          starts_at,
          ends_at,
          timezone,
          delivery_method,
          location_name,
          suburb,
          state,
          postcode,
          country,
          join_url,
          status,
          training_courses!inner (
            id,
            consultant_id,
            title,
            summary,
            description,
            tags,
            status
          )
        `
        )
        .eq("status", "scheduled")
        .eq("training_courses.status", "published")
        .gte("starts_at", from)
        .lt("starts_at", to);

      q = applyRegionFilter(q, region);

      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      for (const row of data || []) {
        const c = row.training_courses;
        if (!row?.id || !UUID_RE.test(String(row.id))) continue;

        results.push({
          id: `training-${row.id}`,
          type: "training",
          session_id: row.id,
          course_id: row.course_id,
          title: c?.title ?? "Training session",
          summary: c?.summary ?? null,
          description: c?.description ?? null,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          timezone: row.timezone,
          delivery_method: row.delivery_method,
          location_name: row.location_name,
          suburb: row.suburb,
          state: row.state,
          postcode: row.postcode,
          country: row.country,
          join_url: row.join_url,
          tags: c?.tags ?? [],
          consultant_id: c?.consultant_id ?? null,
        });
      }
    }

    results.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

    return NextResponse.json({ filters: { types, region, from, to }, items: results });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}