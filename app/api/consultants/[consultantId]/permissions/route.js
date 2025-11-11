export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req, ctx) {
  const { consultantId } = await ctx.params;
  const authHeader = req.headers.get("authorization") || "";
  const accessToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;

  let viewsCount = null;
  try {
    // Use the same pattern as the original SSR page for consistency.
    const sb = await supabaseServerClient();
    const { count, error } = await sb
      .from("consultant_page_views")
      .select("id", { head: true, count: "exact" })
      .eq("consultant_id", consultantId);

    if (!error && Number.isFinite(count)) viewsCount = count;
  } catch {
    // leave null to avoid clobbering client’s SSR baseline
  }

  if (!accessToken) {
    return NextResponse.json({
      isOwner: false,
      isAdmin: false,
      canEdit: false,
      initialFavourite: false,
      viewsCount,
    });
  }

  const userSb = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });

  const { data: userData } = await userSb.auth.getUser(accessToken);
  const user = userData?.user || null;
  if (!user) {
    return NextResponse.json({
      isOwner: false,
      isAdmin: false,
      canEdit: false,
      initialFavourite: false,
      viewsCount,
    });
  }

  const [consultantRes, favRes, adminRes] = await Promise.all([
    userSb.from("consultants").select("id, claimed_by").eq("id", consultantId).maybeSingle(),
    userSb
      .from("consultant_favourites")
      .select("id")
      .eq("consultant_id", consultantId)
      .eq("user_id", user.id)
      .maybeSingle(),
    userSb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (consultantRes.error) {
    return NextResponse.json({ error: "Consultant lookup failed" }, { status: 500 });
  }
  if (!consultantRes.data) {
    return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  }

  const isOwner = consultantRes.data.claimed_by === user.id;
  const isAdmin = Boolean(adminRes.data);
  const canEdit = isOwner || isAdmin;
  const initialFavourite = Boolean(favRes.data);

  return NextResponse.json({
    isOwner,
    isAdmin,
    canEdit,
    initialFavourite,
    viewsCount,
  });
}