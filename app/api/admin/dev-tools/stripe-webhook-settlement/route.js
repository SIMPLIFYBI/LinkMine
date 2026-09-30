export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(req) {
  const authorization = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const sb = await supabaseServerClient({ global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data: adminRow } = await sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 400 });
  }

  const { error } = await sb.rpc("configure_stripe_webhook_settlement_secret", { p_secret: webhookSecret });
  if (error) return NextResponse.json({ ok: false, error: error.message || "Unable to configure webhook settlement." }, { status: 400 });

  return NextResponse.json({ ok: true });
}