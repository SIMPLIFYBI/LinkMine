import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { WELCOME_SUBJECT, buildWelcomeEmailHtml, buildWelcomeEmailText } from "@/lib/emails/welcomeEmail";
import { sendEmail } from "@/lib/emailPostmark";
import { shouldSendEmail, logEmailSent } from "@/lib/emails/trackEmail";
import { siteUrl } from "@/lib/siteUrl";

export async function POST(req) {
  try {
    const authz = (await headers()).get("authorization") || "";
    const token = authz.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = await supabaseServerClient();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = data.user;

    // Check if already sent
    const shouldSend = await shouldSendEmail({
      recipient: user.email,
      emailType: "welcome",
      relatedId: user.id,
    });

    if (!shouldSend) {
      console.log("[welcome] already sent to:", user.email);
      return new NextResponse(null, { status: 204 });
    }

    // Build email
    const html = buildWelcomeEmailHtml({
      firstName: user.user_metadata?.first_name,
      completeProfileUrl: siteUrl("/account"),
      consultantsUrl: siteUrl("/consultants"),
      jobsUrl: siteUrl("/jobs"),
    });
    const text = buildWelcomeEmailText({
      firstName: user.user_metadata?.first_name,
      completeProfileUrl: siteUrl("/account"),
      consultantsUrl: siteUrl("/consultants"),
      jobsUrl: siteUrl("/jobs"),
    });

    // Send email (track errors)
    let sendError = null;
    try {
      await sendEmail({ to: user.email, subject: WELCOME_SUBJECT, html, text });
      console.log("[welcome] sent to:", user.email);
    } catch (e) {
      sendError = e;
      console.error("[welcome] sendEmail error:", e);
    }

    // Log the attempt (sent or failed)
    await logEmailSent({
      recipient: user.email,
      subject: WELCOME_SUBJECT,
      emailType: "welcome",
      relatedId: user.id,
      error: sendError,
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[welcome] error:", e);
    return new NextResponse(null, { status: 204 });
  }
}