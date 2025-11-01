export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

const MAX_PDF_BYTES = 5_000_000; // ~5 MB

function sanitize(name = "") {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function POST(req, { params }) {
  const { consultantId } = await params;
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, claimed_by")
    .eq("id", consultantId)
    .maybeSingle();
  if (!consultant || consultant.claimed_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const isPdf = file.type === "application/pdf" || (file.name || "").toLowerCase().endsWith(".pdf");
  if (!isPdf) return NextResponse.json({ error: "Only PDF attachments are allowed" }, { status: 400 });
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF too large (max ~5 MB)" }, { status: 400 });
  }

  const safeName = sanitize(file.name || "document.pdf");
  const ts = Date.now();
  const path = `users/${userId}/consultants/${consultantId}/attachment/${ts}-${safeName}`;

  const { error: upErr } = await sb.storage
    .from("portfolio")
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message || "Upload failed" }, { status: 400 });

  const { data: pub } = sb.storage.from("portfolio").getPublicUrl(path);
  return NextResponse.json({
    path,
    publicUrl: pub.publicUrl,
    name: safeName,
    mime: "application/pdf",
    size: file.size,
  });
}