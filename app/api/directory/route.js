export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAnonServer } from "@/lib/supabaseAnonServer";

function normaliseMarketParam(value) {
  return value === "oil-gas" || value === "oil_gas" ? "oil_gas" : "mining";
}

export async function GET(req) {
  try {
    const sb = supabaseAnonServer();
    const { searchParams } = new URL(req.url);
    const market = normaliseMarketParam(searchParams.get("market"));

    const [{ data: categories = [], error: categoriesError }, { data: services = [], error: servicesError }] = await Promise.all([
      sb
        .from("service_categories")
        .select("id, name, slug")
        .eq("market", market)
        .order("position", { ascending: true })
        .order("name", { ascending: true }),
      sb
        .from("services")
        .select("id, name, slug, category_id")
        .eq("market", market)
        .order("position", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    const error = categoriesError || servicesError;
    const data = categories.map((category) => ({
      ...category,
      services: services.filter((service) => service.category_id === category.id),
    }));

    if (error) {
      console.error("directory error:", error.message);
      return NextResponse.json({ ok: true, categories: [] });
    }
    return NextResponse.json({ ok: true, market, categories: data || [] });
  } catch (e) {
    console.error("directory fatal:", e);
    return NextResponse.json({ ok: true, categories: [] });
  }
}