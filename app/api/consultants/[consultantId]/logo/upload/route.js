export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

const MAX_LOGO_BYTES = 300_000; // ~300 KB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]); // no SVG for safety

function sanitize(name = "") {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function POST(req, { params }) {
  const { consultantId } = await params;
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Check admin
  let isAdmin = false;
  const { data: adminRow } = await sb
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  isAdmin = Boolean(adminRow);

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, claimed_by")
    .eq("id", consultantId)
    .maybeSingle();

  if (!consultant || (consultant.claimed_by !== userId && !isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, or WEBP allowed" }, { status: 400 });
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Logo too large (max ~300 KB)" }, { status: 400 });
  }

  const safeName = sanitize(file.name || "logo");
  const ts = Date.now();
  const path = `users/${userId}/consultants/${consultantId}/logo/${ts}-${safeName}`;

  const { error: upErr } = await sb.storage
    .from("portfolio")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message || "Upload failed" }, { status: 400 });

  const { data: pub } = sb.storage.from("portfolio").getPublicUrl(path);
  return NextResponse.json({
    path,
    publicUrl: pub.publicUrl,
    name: safeName,
    mime: file.type,
    size: file.size,
  });
}