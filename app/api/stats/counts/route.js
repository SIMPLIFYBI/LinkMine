import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET(req) {
  try {
    const sb = await supabaseServerClient();

    // Get consultant count
    const { count: consultantCount, error: e1 } = await sb
      .from("consultants")
      .select("*", { count: "exact", head: true });

    if (e1) {
      console.error("[stats] consultants error:", e1);
      return NextResponse.json({ error: e1.message }, { status: 500 });
    }

    // Get user count from user_profiles table
    const { count: userCount, error: e2 } = await sb
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    if (e2) {
      console.error("[stats] user_profiles error:", e2);
      return NextResponse.json({ error: e2.message }, { status: 500 });
    }

    // Get page views count
    const { count: pageViewCount, error: e3 } = await sb
      .from("consultant_page_views")
      .select("*", { count: "exact", head: true });

    if (e3) {
      console.error("[stats] page_views error:", e3);
      return NextResponse.json({ error: e3.message }, { status: 500 });
    }

    // Get consultant contacts count
    const { count: contactCount, error: e4 } = await sb
      .from("consultant_contacts")
      .select("*", { count: "exact", head: true });

    if (e4) {
      console.error("[stats] contacts error:", e4);
      return NextResponse.json({ error: e4.message }, { status: 500 });
    }

    return NextResponse.json({
      consultants: consultantCount || 0,
      users: userCount || 0,
      pageViews: pageViewCount || 0,
      contacts: contactCount || 0,
    });
  } catch (err) {
    console.error("[stats] error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}