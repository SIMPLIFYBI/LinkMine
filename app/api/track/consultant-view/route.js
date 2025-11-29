import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(req) {
  const stage = [];
  try {
    const body = await req.json().catch(() => ({}));
    stage.push({ step: "parsed_body", body });

    // Destructure but ignore 'source' since column doesn't exist
    const { consultantId, source: receivedSource = null, anonId: bodyAnon = null, force = false } = body;
    if (!consultantId) {
      return NextResponse.json({ error: "Missing consultantId", stage }, { status: 400 });
    }

    stage.push({ step: "source_ignored_no_column", receivedSource });

    const jar = cookies();
    let anonId = bodyAnon || jar.get("ml_anon_id")?.value || null;
    if (!anonId) {
      anonId = crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
      stage.push({ step: "minted_anon", anonId });
    } else {
      stage.push({ step: "using_existing_anon", anonId });
    }

    const sb = await supabaseServerClient();
    stage.push({ step: "supabase_client_ok" });

    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id || null;
    stage.push({ step: "auth_lookup", userId });

    // Cooldown window
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    stage.push({ step: "cooldown_window", since });

    if (!force) {
      let q = sb
        .from("consultant_page_views")
        .select("id", { head: true, count: "exact" })
        .eq("consultant_id", consultantId)
        .gte("viewed_at", since);

      if (userId) q = q.eq("viewer_id", userId);
      else q = q.eq("anon_hash", anonId);

      const { count, error: countError } = await q;
      if (countError) {
        stage.push({ step: "count_error", countError: countError.message });
        return NextResponse.json({ error: countError.message, stage }, { status: 500 });
      }
      stage.push({ step: "count_result", count });

      if ((count ?? 0) > 0) {
        const res = NextResponse.json({ ok: true, skipped: true, stage });
        if (!jar.get("ml_anon_id")?.value) {
          res.cookies.set("ml_anon_id", anonId, {
            httpOnly: false,
            sameSite: "lax",
            secure: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
          });
        }
        return res;
      }
    } else {
      stage.push({ step: "forced_insert" });
    }

    const ua = req.headers.get("user-agent") || null;
    const payload = {
      consultant_id: consultantId,
      viewer_id: userId,
      anon_hash: userId ? null : anonId,
      user_agent: ua
      // source intentionally omitted
    };
    stage.push({ step: "insert_payload", payload });

    const { error: insertError } = await sb.from("consultant_page_views").insert(payload);
    if (insertError) {
      stage.push({ step: "insert_error", insertError: insertError.message });
      return NextResponse.json({ error: insertError.message, stage }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true, stage });
    if (!jar.get("ml_anon_id")?.value) {
      res.cookies.set("ml_anon_id", anonId, {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (e) {
    stage.push({ step: "catch", message: e?.message });
    return NextResponse.json({ error: "Unexpected error", stage }, { status: 500 });
  }
}