import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { WELCOME_SUBJECT, buildWelcomeEmailHtml, buildWelcomeEmailText } from "@/lib/emails/welcomeEmail";
import { sendEmail } from "@/lib/emailPostmark";
import { siteUrl } from "@/lib/siteUrl";

export async function POST() {
  try {
    const authz = headers().get("authorization") || "";
    const token = authz.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const sb = createClient(supabaseUrl, anon, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = data.user;
    if (user.user_metadata?.welcome_sent) {
      return new NextResponse(null, { status: 204 });
    }

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

    await sendEmail({ to: user.email, subject: WELCOME_SUBJECT, html, text });

    if (adminKey) {
      const admin = createClient(supabaseUrl, adminKey, { auth: { persistSession: false } });
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata || {}), welcome_sent: true },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("welcome email error:", e);
    return new NextResponse(null, { status: 204 });
  }
}