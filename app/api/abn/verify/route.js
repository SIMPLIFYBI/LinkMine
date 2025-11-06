export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";
import { searchByABN, searchByASIC } from "@/lib/abrClient";
import { normalizeAbn, normalizeAcn } from "@/lib/abnValidators";

export async function POST(req) {
  try {
    const sb = await supabaseRouteClient();
    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { consultantId, abn, acn, force = false } = await req.json().catch(() => ({}));
    if (!consultantId) {
      return NextResponse.json({ error: "consultantId required" }, { status: 400 });
    }

    // Load consultant + check owner/admin
    const [{ data: c }, { data: adminRow }] = await Promise.all([
      sb.from("consultants").select("id, claimed_by, abn, acn, abn_last_checked, abn_data, abn_verified").eq("id", consultantId).maybeSingle(),
      sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!c) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    const isOwner = c.claimed_by === user.id;
    const isAdmin = Boolean(adminRow);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Normalize inputs (optional: allow one of ABN or ACN)
    const abnNorm = abn ? normalizeAbn(abn) : null;
    const acnNorm = acn ? normalizeAcn(acn) : null;
    if (!abnNorm && !acnNorm) {
      return NextResponse.json({ error: "Valid ABN or ACN required" }, { status: 400 });
    }

    // Simple freshness gate: 24h cache when the ABN hasn't changed
    const sameAbn = abnNorm && c.abn && c.abn.replace(/\D/g, "") === abnNorm;
    const fresh =
      sameAbn &&
      c.abn_last_checked &&
      Date.now() - new Date(c.abn_last_checked).getTime() < 24 * 60 * 60 * 1000;

    if (fresh && !force) {
      return NextResponse.json({
        ok: true,
        source: "cache",
        consultantId,
        summary: {
          abn: c.abn,
          acn: c.acn || null,
          verified: c.abn_verified,
          lastChecked: c.abn_last_checked,
          data: c.abn_data || {},
        },
      });
    }

    // Call ABR
    let result;
    if (abnNorm) {
      result = await searchByABN(abnNorm);
    } else {
      result = await searchByASIC(acnNorm);
    }

    if (!result?.abn) {
      // We store the normalized input but do not verify
      const { error: upErr } = await sb
        .from("consultants")
        .update({
          abn: abnNorm || null,
          acn: result?.acn || acnNorm || null,
          abn_verified: false,
          abn_status: result?.status || null,
          abn_entity_name: result?.entityName || null,
          abn_entity_type: result?.entityType || null,
          abn_gst_registered_from: result?.gstRegisteredFrom || null,
          abn_last_checked: new Date().toISOString(),
          abn_data: result?.raw || {},
        })
        .eq("id", consultantId);
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        source: "live",
        consultantId,
        summary: { ...result, verified: false },
      });
    }

    const status = String(result.status || "").toLowerCase();
    const verified = status.includes("active");

    const payload = {
      abn: result.abn,
      acn: result.acn || acnNorm || null,
      abn_verified: verified,
      abn_status: result.status || null,
      abn_entity_name: result.entityName || null,
      abn_entity_type: result.entityType || null,
      abn_gst_registered_from: result.gstRegisteredFrom || null,
      abn_last_checked: new Date().toISOString(),
      abn_data: result.raw || {},
    };

    const { error: updateErr } = await sb.from("consultants").update(payload).eq("id", consultantId);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      source: "live",
      consultantId,
      summary: { ...result, verified: verified },
    });
  } catch (e) {
    const msg = e?.name === "AbortError" ? "ABR service timed out" : e?.message || "Verify failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}