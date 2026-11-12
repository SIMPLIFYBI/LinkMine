export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { siteUrl } from "@/lib/siteUrl";
import { sendEmail } from "@/lib/emailPostmark";
import { logEmailSent } from "@/lib/emails/trackEmail";
import { buildVaultCreatorClaimEmail } from "@/lib/emails/vaultCreatorClaim";

const EMAIL_TYPE = "vault_creator_claim_outreach_2026";

async function getAdmin(req) {
  const sb = await supabaseServerClient({ global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 };

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);
  const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!adminRow && !allowedEmails.includes(email)) return { error: "Forbidden", status: 403 };
  return { sb };
}

async function getEligibleCreators(sb, ids) {
  let query = sb
    .from("consultants")
    .select("id, display_name, company, contact_email, profile_type, claimed_by, claimed_at")
    .eq("status", "approved")
    .eq("visibility", "public")
    .in("profile_type", ["creator", "both"])
    .is("claimed_by", null)
    .is("claimed_at", null)
    .order("display_name", { ascending: true });
  if (ids?.length) query = query.in("id", ids);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).filter((creator) => String(creator.contact_email || "").trim());
}

export async function GET(req) {
  const admin = await getAdmin(req);
  if (admin.error) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  try {
    const creators = await getEligibleCreators(admin.sb);
    const base = siteUrl("", req);
    return NextResponse.json({ ok: true, creators: creators.map((creator) => ({ ...creator, profileUrl: `${base}/consultants/${creator.id}` })) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Unable to load creators." }, { status: 500 });
  }
}

export async function POST(req) {
  const admin = await getAdmin(req);
  if (admin.error) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  try {
    const payload = await req.json().catch(() => ({}));
    const ids = Array.from(new Set((Array.isArray(payload.creatorIds) ? payload.creatorIds : []).map(String).filter(Boolean)));
    if (!ids.length) return NextResponse.json({ ok: false, error: "Select at least one creator." }, { status: 400 });

    const creators = await getEligibleCreators(admin.sb, ids);
    const base = siteUrl("", req);
    const sentIds = [];
    const failed = [];
    for (const creator of creators) {
      const recipient = creator.contact_email.trim();
      const email = buildVaultCreatorClaimEmail({ creator, profileUrl: `${base}/consultants/${creator.id}`, signupUrl: `${base}/signup`, loginUrl: `${base}/login` });
      let sendError;
      try {
        const result = await sendEmail({ to: recipient, bcc: "info@youmine.com.au", subject: email.subject, html: email.html, text: email.text });
        if (!result?.ok) sendError = new Error(result?.error || "Email delivery failed.");
      } catch (error) {
        sendError = error;
      }
      await logEmailSent({ recipient, subject: email.subject, emailType: EMAIL_TYPE, relatedId: creator.id, error: sendError });
      if (sendError) failed.push({ id: creator.id, error: sendError.message || String(sendError) });
      else sentIds.push(creator.id);
    }
    return NextResponse.json({ ok: true, requested: ids.length, sentIds, failed });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Unable to send creator claim emails." }, { status: 500 });
  }
}