import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(req) {
  try {
    const { consultantId, source = null, anonId = null } = await req.json();
    if (!consultantId) {
      return NextResponse.json({ error: "Missing consultantId" }, { status: 400 });
    }

    const sb = await supabaseServerClient();
    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id || null;

    // cooldown: 6h (was 12h)
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const viewerFilter = userId
      ? { viewer_id: userId }
      : anonId
      ? { anon_hash: anonId }
      : null;

    if (!viewerFilter) {
      // Create a per-browser anon ID if client didn’t send one (best to send from client)
      return NextResponse.json({ error: "Missing anonId for anonymous view" }, { status: 400 });
    }

    // Exists check (skip duplicate within cooldown)
    let q = sb
      .from("consultant_page_views")
      .select("id", { count: "exact", head: true })
      .eq("consultant_id", consultantId)
      .gte("viewed_at", since);

    if (viewerFilter.viewer_id) q = q.eq("viewer_id", viewerFilter.viewer_id);
    if (viewerFilter.anon_hash) q = q.eq("anon_hash", viewerFilter.anon_hash);

    const { count } = await q;
    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ua = req.headers.get("user-agent") || null;

    const payload = {
      consultant_id: consultantId,
      viewer_id: userId,
      anon_hash: userId ? null : anonId,
      user_agent: ua,
    };

    const { error } = await sb.from("consultant_page_views").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Optional: also write to profile_views if you choose to keep it
    // await sb.from("profile_views").insert({ consultant_id: consultantId, viewer_id: userId, source });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}