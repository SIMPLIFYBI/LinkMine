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

export async function POST(_req, context) {
  const { consultantId } = await context.params;

  const sb = await supabaseFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: consultant, error } = await sb
    .from("consultants")
    .select(
      "id, display_name, contact_email, claim_token, claimed_by, claimed_at"
    )
    .eq("id", consultantId)
    .maybeSingle();

  if (error || !consultant) {
    return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  }
  if (!consultant.contact_email) {
    return NextResponse.json(
      { error: "No contact email on record." },
      { status: 400 }
    );
  }
  if (consultant.claimed_by || consultant.claimed_at) {
    return NextResponse.json(
      { error: "This profile has already been claimed." },
      { status: 409 }
    );
  }

  const token = randomUUID();
  const { error: updateError } = await sb
    .from("consultants")
    .update({ claim_token: token })
    .eq("id", consultant.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Unable to initiate claim." },
      { status: 500 }
    );
  }

  const fromEmail = process.env.EMAIL_FROM;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://link-mine.vercel.app").replace(/\/$/, "");

  if (!fromEmail || !siteUrl) {
    return NextResponse.json(
      { error: "Claim email configuration missing." },
      { status: 500 }
    );
  }

  const claimUrl = `${siteUrl}/consultants/${consultant.id}/claim?token=${token}`;

  const htmlBody = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 0;font-family:'Inter',system-ui,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid rgba(148,163,184,0.2);border-radius:24px;padding:32px;">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.18em;color:#38bdf8;text-transform:uppercase;">MINE LINK</p>
              </td>
            </tr>
            <tr>
              <td style="color:#e2e8f0;font-size:20px;font-weight:600;text-align:center;padding-bottom:12px;">
                Confirm consultant ownership
              </td>
            </tr>
            <tr>
              <td style="color:#94a3b8;font-size:15px;line-height:1.6;text-align:center;padding-bottom:24px;">
                You requested to manage <strong style="color:#e2e8f0;">${consultant.display_name}</strong>.
                Click the button below to finish claiming the profile.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <a
                  href="${claimUrl}"
                  style="
                    display:inline-block;
                    padding:14px 32px;
                    border-radius:999px;
                    border:2px solid transparent;
                    background-image:linear-gradient(#0f172a,#0f172a),linear-gradient(135deg,#0ea5e9,#6366f1);
                    background-origin:border-box;
                    background-clip:content-box,border-box;
                    color:#e2e8f0;
                    font-weight:600;
                    text-decoration:none;
                    letter-spacing:0.02em;
                  "
                >
                  Claim profile
                </a>
              </td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:13px;line-height:1.5;text-align:center;">
                If the button doesn’t work, copy and paste this URL into your browser:<br>
                <span style="color:#94a3b8;word-break:break-all;">${claimUrl}</span>
              </td>
            </tr>
          </table>
          <p style="margin-top:20px;font-size:12px;color:#475569;">© ${new Date().getFullYear()} Mine Link</p>
        </td>
      </tr>
    </table>
  `;

  await postmarkClient().sendEmail({
    From: fromEmail,
    To: consultant.contact_email,
    Subject: `Confirm ownership of ${consultant.display_name}`,
    HtmlBody: htmlBody,
    TextBody: `Confirm ownership:\n${claimUrl}`,
    MessageStream: "outbound",
  });

  return NextResponse.json({ ok: true });
}