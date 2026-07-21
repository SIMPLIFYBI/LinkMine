export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { timedRoute } from "@/lib/apiTiming";

export async function GET() {
  return timedRoute("resources.categories.list", async () => {
    const sb = await supabaseServerClient();

    const { data, error } = await sb
      .from("resource_categories")
      .select("id, name, slug, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, categories: data || [] });
  });
}
