import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

async function getAcceptedRequest(sb, requestId, userId) {
  const { data, error } = await sb
    .from("talent_connection_requests")
    .select("id, candidate_worker_id, requester_user_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !data) return { error: "Connection not found.", status: 404 };
  if (data.status !== "accepted") return { error: "A resume can be shared after a connection is accepted.", status: 403 };
  if (data.candidate_worker_id !== userId && data.requester_user_id !== userId) return { error: "Not authorized.", status: 403 };
  return { request: data };
}

export async function POST(_req, { params }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { requestId } = await params;
  const access = await getAcceptedRequest(sb, requestId, auth.user.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.request.candidate_worker_id !== auth.user.id) {
    return NextResponse.json({ error: "Only the candidate can share a resume." }, { status: 403 });
  }

  const { data: resume, error: resumeError } = await sb
    .from("talent_resume_files")
    .select("id, file_name")
    .eq("candidate_worker_id", auth.user.id)
    .eq("is_current", true)
    .maybeSingle();
  if (resumeError || !resume) return NextResponse.json({ error: "Upload a current resume before sharing it." }, { status: 400 });

  const { error } = await sb.from("talent_resume_shares").upsert({
    request_id: requestId,
    resume_file_id: resume.id,
    candidate_worker_id: auth.user.id,
    shared_at: new Date().toISOString(),
  }, { onConflict: "request_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, resume: { fileName: resume.file_name } });
}

export async function GET(_req, { params }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { requestId } = await params;
  const access = await getAcceptedRequest(sb, requestId, auth.user.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data: share, error } = await sb
    .from("talent_resume_shares")
    .select("resume_file_id, talent_resume_files(file_name, object_path)")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const resume = share?.talent_resume_files;
  if (!resume?.object_path) return NextResponse.json({ shared: false });

  const { data: signed, error: signedError } = await sb.storage
    .from("talent-resumes")
    .createSignedUrl(resume.object_path, 60 * 5, { download: resume.file_name });
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 400 });
  return NextResponse.json({ shared: true, fileName: resume.file_name, url: signed.signedUrl });
}