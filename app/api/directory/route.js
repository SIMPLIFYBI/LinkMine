export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAnonServer } from "@/lib/supabaseAnonServer";

export async function GET() {
  try {
    const sb = supabaseAnonServer();

    // Adjust to your schema. Fallback returns an empty list on error.
    const { data, error } = await sb
      .from("service_categories")
      .select("id, name, slug, services:services(id, name, slug)")
      .order("name", { ascending: true });

    if (error) {
      console.error("directory error:", error.message);
      return NextResponse.json({ ok: true, categories: [] });
    }
    return NextResponse.json({ ok: true, categories: data || [] });
  } catch (e) {
    console.error("directory fatal:", e);
    return NextResponse.json({ ok: true, categories: [] });
  }
}