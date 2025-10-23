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

export async function POST(req, { params }) {
  const { consultantId } = params;
  const sb = await supabaseFromCookies();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: consultant, error } = await sb
    .from("consultants")
    .select("id, display_name, contact_email, claimed_by, claimed_at")
    .eq("id", consultantId)
    .maybeSingle();

  if (error || !consultant) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  if (!consultant.contact_email) return NextResponse.json({ error: "No contact email on record." }, { status: 400 });
  if (consultant.claimed_by || consultant.claimed_at) return NextResponse.json({ error: "This profile has already been claimed." }, { status: 409 });

  const token = randomUUID();
  const { error: updateError } = await sb.from("consultants").update({ claim_token: token }).eq("id", consultant.id);
  if (updateError) return NextResponse.json({ error: "Unable to initiate claim." }, { status: 500 });

  const claimUrl = siteUrl(`/consultants/${consultant.id}/claim?token=${token}`, req);

  const HtmlBody = buildClaimProfileHtml(consultant.display_name, claimUrl);
  const TextBody = buildClaimProfileText(consultant.display_name, claimUrl);

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