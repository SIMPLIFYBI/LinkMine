export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { siteUrl } from "@/lib/siteUrl";
import { sendEmail } from "@/lib/emailPostmark";
import { logEmailSent } from "@/lib/emails/trackEmail";
import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "@/lib/emails/emailLayout";

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

function buildCreatorClaimEmail({ creator, profileUrl, signupUrl, loginUrl }) {
  const name = creator.display_name || creator.company || "there";
  const subject = `Welcome to the YouMine Vault: your profile is ready`;
  const text = [
    `Hi ${name},`, "", "Welcome to the YouMine Vault.", "",
    "The Vault is a directory that helps the mining community discover useful digital products, resources, and the creators behind them.",
    "We have created a profile for you and populated it with public information we could find, so people can more easily discover your work.", "",
    `Your profile: ${profileUrl}`, "", "To review and claim ownership:", "1. Open your profile link.",
    `2. Create an account at ${signupUrl}, or log in at ${loginUrl} if you already have one.`,
    "3. Return to your profile and select Claim Profile.", "",
    "Once claimed, you can review and update the profile yourself.",
    "If you would prefer not to be included in the Vault, reply to this email and we will remove the profile on request.", "",
    "Kind regards,", "The YouMine Team",
  ].join("\n");
  const html = buildEmailLayout({
    eyebrow: "YouMine Vault",
    title: "Welcome to the YouMine Vault",
    preheader: `Your creator profile is ready for review and claim.`,
    content: `<p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(name)},</p><p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">The YouMine Vault is a directory that helps the mining community discover useful digital products, resources, and the creators behind them.</p><p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">We have created a profile for you and done our best to populate it with publicly available information, so people can more easily discover your work.</p>${emailPanel(`<div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8fe9ff;margin-bottom:8px;">Your profile</div><a href="${escapeHtml(profileUrl)}" style="color:#8fe9ff;font-size:14px;font-weight:700;word-break:break-word;">${escapeHtml(profileUrl)}</a>`)}${emailButton({ href: profileUrl, label: "Review and claim your profile" })}<p style="margin:4px 0 0;color:#91abc0;font-size:13px;line-height:1.6;">Create an account or log in first, then return to your profile and select Claim Profile. Once claimed, you can review and update it yourself.</p><p style="margin:18px 0 0;color:#d8e7f4;font-size:14px;line-height:1.65;">Would you prefer not to be included? Reply to this email and we will remove your profile on request.</p>`,
  });
  return { subject, text, html };
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
      const email = buildCreatorClaimEmail({ creator, profileUrl: `${base}/consultants/${creator.id}`, signupUrl: `${base}/signup`, loginUrl: `${base}/login` });
      let sendError;
      try {
        const result = await sendEmail({ to: recipient, subject: email.subject, html: email.html, text: email.text });
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