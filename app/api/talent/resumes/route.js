import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await sb
    .from("talent_resume_files")
    .select("id, file_name, content_type, byte_size, is_current, created_at")
    .eq("candidate_worker_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ resumes: data || [] });
}

export async function POST(req) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a resume file." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Upload a PDF, DOC, or DOCX resume up to 10 MB." }, { status: 400 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "pdf";
  const objectPath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await sb.storage.from("talent-resumes").upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  await sb.from("talent_resume_files").update({ is_current: false, updated_at: new Date().toISOString() }).eq("candidate_worker_id", auth.user.id).eq("is_current", true);
  const { data, error } = await sb
    .from("talent_resume_files")
    .insert({
      candidate_worker_id: auth.user.id,
      object_path: objectPath,
      file_name: file.name.slice(0, 255),
      content_type: file.type,
      byte_size: file.size,
      is_current: true,
    })
    .select("id, file_name, content_type, byte_size, is_current, created_at")
    .single();

  if (error) {
    await sb.storage.from("talent-resumes").remove([objectPath]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, resume: data }, { status: 201 });
}