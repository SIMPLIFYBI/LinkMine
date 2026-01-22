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

async function tryFetchConsultants(sb, consultantIds) {
  // Try common table names without breaking the endpoint.
  const candidates = [
    { table: "consultants", select: "id,display_name,name,logo_url,thumbnail_url,avatar_url,photo_url,image_url" },
    { table: "consultant_profiles", select: "id,display_name,name,logo_url,thumbnail_url,avatar_url,photo_url,image_url" },
    { table: "profiles", select: "id,display_name,full_name,name,avatar_url,photo_url,image_url,logo_url,thumbnail_url" },
  ];

  for (const c of candidates) {
    const { data, error } = await sb.from(c.table).select(c.select).in("id", consultantIds);
    if (!error && Array.isArray(data)) return { table: c.table, rows: data, error: null };
  }

  // last attempt: return the last error from "consultants" for debugging
  const last = await sb
    .from("consultants")
    .select("id,display_name,name,logo_url,thumbnail_url,avatar_url,photo_url,image_url")
    .in("id", consultantIds);

  return { table: "consultants", rows: Array.isArray(last.data) ? last.data : [], error: last.error?.message || "Unknown" };
}

function pickName(row) {
  return row?.display_name || row?.full_name || row?.name || null;
}

function pickLogo(row) {
  return row?.logo_url || row?.thumbnail_url || row?.avatar_url || row?.photo_url || row?.image_url || null;
}

function asObject(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return null;
}

function buildStoragePublicUrl(supabaseUrl, bucket, path) {
  if (!supabaseUrl || !bucket || !path) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${String(path).replace(/^\//, "")}`;
}

function pickLogoFromConsultantMetadata(supabaseUrl, metadata) {
  const m = asObject(metadata);
  if (!m) return null;

  // 1) common direct URL keys
  const direct =
    m.logo_url ||
    m.logoUrl ||
    m.avatar_url ||
    m.avatarUrl ||
    m.image_url ||
    m.imageUrl ||
    m.photo_url ||
    m.photoUrl;

  if (typeof direct === "string" && direct.startsWith("http")) return direct;

  // 2) common nested objects: { logo: { url | publicUrl | path } }
  const logoObj = asObject(m.logo) || asObject(m.branding?.logo) || asObject(m.profile?.logo);
  const nestedUrl = logoObj?.url || logoObj?.publicUrl;
  if (typeof nestedUrl === "string" && nestedUrl.startsWith("http")) return nestedUrl;

  // 3) storage-like values (bucket/path)
  // e.g. { logo: { bucket: "portfolio", path: "users/.../logo/file.jpg" } }
  const bucket = logoObj?.bucket || m.logo_bucket || m.bucket;
  const path = logoObj?.path || logoObj?.key || m.logo_path || m.path;
  if (bucket && path) return buildStoragePublicUrl(supabaseUrl, bucket, path);

  // 4) single string path that includes bucket at start: "portfolio/users/....jpg"
  // or "users/...jpg" with implicit bucket "portfolio"
  const maybePath = nestedUrl || logoObj?.path || direct;
  if (typeof maybePath === "string") {
    if (maybePath.includes("/storage/v1/object/public/") && maybePath.startsWith("http")) return maybePath;

    const cleaned = maybePath.replace(/^\//, "");
    const parts = cleaned.split("/");
    if (parts.length >= 2) {
      const maybeBucket = parts[0];
      const rest = parts.slice(1).join("/");
      // if it already looks like your bucket
      if (maybeBucket === "portfolio" || maybeBucket === "public") {
        return buildStoragePublicUrl(supabaseUrl, maybeBucket, rest);
      }
      // fallback: assume bucket "portfolio"
      return buildStoragePublicUrl(supabaseUrl, "portfolio", cleaned);
    }
  }

  return null;
}

function pickNameFromConsultantMetadata(metadata) {
  const m = asObject(metadata);
  if (!m) return null;
  return m.display_name || m.displayName || m.name || m.full_name || m.fullName || null;
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

          // ✅ filled (best-effort) below
          provider_name: null,
          provider_logo_url: null,
        });
      }
    }

    // ✅ Consultant enrichment using consultants.metadata
    try {
      const consultantIds = Array.from(
        new Set(
          results
            .filter((r) => r.type === "training" && r.consultant_id && UUID_RE.test(String(r.consultant_id)))
            .map((r) => r.consultant_id)
        )
      );

      if (consultantIds.length) {
        const { data: consultants, error: cErr } = await sb
          .from("consultants")
          .select("id,metadata")
          .in("id", consultantIds);

        if (!cErr && Array.isArray(consultants) && consultants.length) {
          const byId = new Map(consultants.map((c) => [c.id, c]));

          for (const r of results) {
            if (r.type !== "training" || !r.consultant_id) continue;
            const c = byId.get(r.consultant_id);
            if (!c) continue;

            const meta = c.metadata;

            // Fill name/logo ONLY if missing (keeps any existing values)
            if (!r.provider_name) r.provider_name = pickNameFromConsultantMetadata(meta) || null;
            if (!r.provider_logo_url) r.provider_logo_url = pickLogoFromConsultantMetadata(process.env.NEXT_PUBLIC_SUPABASE_URL, meta);
          }
        }
      }
    } catch {
      // ignore enrichment failures
    }

    results.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

    const payload = { filters: { types, region, from, to }, items: results };
    return NextResponse.json({ filters: { types, region, from, to }, items: results });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}