import { NextResponse } from "next/server";
import { getAnalyticsAdminContext } from "@/lib/adminAnalyticsAuth";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";

export const runtime = "nodejs";

export async function GET(request) {
  const admin = await getAnalyticsAdminContext();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  const days = Number(new URL(request.url).searchParams.get("days") || "30");
  if (![7, 30, 90].includes(days)) {
    return NextResponse.json({ ok: false, error: "Invalid reporting period." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdminClient().rpc("admin_in_app_analytics", { p_days: days });
    if (error || !data) throw error || new Error("Empty analytics report");
    return NextResponse.json({ ok: true, report: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[admin in-app analytics]", error);
    return NextResponse.json({ ok: false, error: "In-app reporting is temporarily unavailable." }, { status: 503 });
  }
}