import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

function isHttpUrl(s) {
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    const sb = await supabaseServerClient();
    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "You must be logged in to submit an event." }, { status: 401 });
    }

    const body = await req.json();

    const title = String(body?.title || "").trim();
    const summary = String(body?.summary || "").trim() || null;
    const description = String(body?.description || "").trim() || null;

    const starts_at = body?.starts_at ? new Date(body.starts_at) : null;
    const ends_at = body?.ends_at ? new Date(body.ends_at) : null;

    const timezone = String(body?.timezone || "").trim() || null;
    const delivery_method = String(body?.delivery_method || "in_person").trim();

    const location_name = String(body?.location_name || "").trim() || null;
    const suburb = String(body?.suburb || "").trim() || null;
    const state = String(body?.state || "").trim() || null;
    const country = String(body?.country || "AU").trim() || "AU";

    const join_url = String(body?.join_url || "").trim() || null;
    const external_url = String(body?.external_url || "").trim() || null;

    const organizer_name = String(body?.organizer_name || "").trim() || null;
    const organizer_url = String(body?.organizer_url || "").trim() || null;

    const tags =
      Array.isArray(body?.tags)
        ? body.tags.map((t) => String(t).trim()).filter(Boolean)
        : [];

    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!starts_at || Number.isNaN(starts_at.getTime())) return NextResponse.json({ error: "Valid start date/time is required." }, { status: 400 });
    if (!ends_at || Number.isNaN(ends_at.getTime())) return NextResponse.json({ error: "Valid end date/time is required." }, { status: 400 });
    if (!(ends_at > starts_at)) return NextResponse.json({ error: "End must be after start." }, { status: 400 });

    if (!["in_person", "online", "hybrid"].includes(delivery_method)) {
      return NextResponse.json({ error: "Invalid delivery_method." }, { status: 400 });
    }

    if (!isHttpUrl(join_url) || !isHttpUrl(external_url) || !isHttpUrl(organizer_url)) {
      return NextResponse.json({ error: "Links must be valid http(s) URLs." }, { status: 400 });
    }

    const payload = {
      submitted_by: userId,
      status: "pending",
      title,
      summary,
      description,
      starts_at: starts_at.toISOString(),
      ends_at: ends_at.toISOString(),
      timezone,
      delivery_method,
      location_name,
      suburb,
      state,
      country,
      join_url,
      external_url,
      organizer_name,
      organizer_url,
      tags,
    };

    const { data, error } = await sb
      .from("event_submissions")
      .insert(payload)
      .select("id,status,submitted_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}