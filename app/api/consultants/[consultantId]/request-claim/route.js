export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "crypto";
import { postmarkClient } from "@/lib/postmark";
import { siteUrl } from "@/lib/siteUrl";
import { buildClaimProfileHtml, buildClaimProfileText } from "@/lib/emails/claimProfile";

async function supabaseFromCookies() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => jar.get(name)?.value, set() {}, remove() {} } }
  );
}

export async function POST(req, ctx) {
  const { consultantId } = await ctx.params;
  const sb = await supabaseFromCookies();

  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: consultant, error } = await sb
    .from("consultants")
    .select("id, display_name, contact_email, claimed_by, claimed_at")
    .eq("id", consultantId)
    .maybeSingle();

  if (error || !consultant) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  if (!consultant.contact_email) return NextResponse.json({ error: "No contact email on record." }, { status: 400 });
  if (consultant.claimed_by || consultant.claimed_at) {
    return NextResponse.json({ error: "This profile has already been claimed." }, { status: 409 });
  }

  // Prepare claim token
  const token = randomUUID();
  const { error: updErr } = await sb
    .from("consultants")
    .update({ claim_token: token })
    .eq("id", consultant.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  // Gather logging details (names from user_profiles; IP/UA from headers)
  let firstName = null;
  let lastName = null;
  try {
    const { data: profile } = await sb
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    firstName = profile?.first_name ?? null;
    lastName = profile?.last_name ?? null;
  } catch {
    // Ignore lookup errors; logging is best-effort
  }

  const ua = req.headers.get("user-agent") || null;
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip =
    (fwd.split(",")[0] || "").trim() ||
    req.headers.get("x-real-ip") ||
    null;

  // Best-effort: log claim attempt (don’t fail the request if logging fails)
  try {
    await sb.from("claim_requests").insert({
      user_id: user.id,
      consultant_id: consultant.id,
      first_name: firstName,
      last_name: lastName,
      contact_email: consultant.contact_email,
      request_ip: ip,
      user_agent: ua
    });
  } catch {
    // swallow to avoid blocking email send
  }

  // Build and send email
  const enterCodeUrl = siteUrl(`/claim?consultant=${consultant.id}`, req);
  const HtmlBody = buildClaimProfileHtml(consultant.display_name, enterCodeUrl, token);
  const TextBody = buildClaimProfileText(consultant.display_name, enterCodeUrl, token);

  await postmarkClient().sendEmail({
    From: process.env.EMAIL_FROM,
    To: consultant.contact_email,
    Subject: `Confirm ownership of ${consultant.display_name}`,
    HtmlBody,
    TextBody,
    MessageStream: "outbound",
  });

  return NextResponse.json({ ok: true });
}