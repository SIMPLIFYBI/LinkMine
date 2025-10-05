import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "crypto";
import { postmarkClient } from "@/lib/postmark";

async function supabaseFromCookies() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => jar.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );
}

export async function POST(_req, { params }) {
  const sb = await supabaseFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const consultantId = params.consultantId;
  const { data: consultant, error } = await sb
    .from("consultants")
    .select("id, display_name, contact_email, claim_token, claimed_by, claimed_at")
    .eq("id", consultantId)
    .maybeSingle();
  if (error || !consultant) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  if (!consultant.contact_email) return NextResponse.json({ error: "No contact email on record." }, { status: 400 });
  if (consultant.claimed_by || consultant.claimed_at)
    return NextResponse.json({ error: "Profile already claimed." }, { status: 409 });

  const token = randomUUID();
  const { error: updateError } = await sb
    .from("consultants")
    .update({ claim_token: token })
    .eq("id", consultant.id);
  if (updateError) return NextResponse.json({ error: "Unable to initialise claim." }, { status: 500 });

  const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/consultants/${consultant.id}/claim?token=${token}`;
  await postmarkClient().sendEmail({
    From: process.env.POSTMARK_FROM_EMAIL,
    To: consultant.contact_email,
    Subject: `Confirm ownership of ${consultant.display_name}`,
    HtmlBody: `<p>Confirm ownership:</p><p><a href="${claimUrl}">${claimUrl}</a></p>`,
    TextBody: `Confirm ownership: ${claimUrl}`,
    MessageStream: "outbound",
  });

  return NextResponse.json({ ok: true });
}