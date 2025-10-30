export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { ServerClient as Postmark } from "postmark";
import { siteUrl } from "@/lib/siteUrl";
import { buildContactConsultantEmail } from "@/lib/emails/contactConsultant";

const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN || process.env.POSTMARK_SERVER_TOKEN;
// CHANGED: default to your verified sender
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "info@youmine.com.au";
// Optional display name
const FROM_NAME = process.env.POSTMARK_FROM_NAME || "YouMine";

export async function POST(req, { params }) {
  try {
    const { consultantId } = await params;
    if (!consultantId) {
      return NextResponse.json({ error: "Missing consultantId" }, { status: 400 });
    }

    const sb = await supabaseServerClient();

    const { data: auth } = await sb.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      subject = "",
      message = "",
      name = "",
      email = "",
      phone = "",
      location = "",
      budget = "",
    } = body || {};

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const { data: consultant, error } = await sb
      .from("consultants")
      .select("id, display_name, contact_email, visibility, status")
      .eq("id", consultantId)
      .maybeSingle();

    if (error || !consultant) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }
    if (consultant.visibility !== "public" || consultant.status !== "approved") {
      return NextResponse.json({ error: "Consultant is not publicly contactable" }, { status: 403 });
    }

    const toEmail = consultant.contact_email;
    if (!toEmail) {
      return NextResponse.json({ error: "Consultant has no contact email set" }, { status: 400 });
    }

    const profileUrl = siteUrl(`/consultants/${consultantId}`, req);

    const sender = {
      name: name?.trim() || user.user_metadata?.full_name || user.email,
      email: email?.trim() || user.email,
      phone: phone?.trim() || "",
    };

    if (!POSTMARK_TOKEN || !FROM_EMAIL) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const { HtmlBody, TextBody } = buildContactConsultantEmail({
      consultantName: consultant.display_name || "Consultant",
      toEmail,
      subject: subject.trim(),
      message: message.trim(),
      location: location?.trim() || "",
      budget: budget?.trim() || "",
      profileUrl,
      sender,
    });

    const client = new Postmark(POSTMARK_TOKEN);
    const sendRes = await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`, // CHANGED
      To: toEmail,
      Subject: `YouMine enquiry: ${subject.trim()}`,
      HtmlBody,
      TextBody,
      MessageStream: "outbound",
      ReplyTo: sender.email, // replies go to the user
      TrackOpens: true,
    });

    return NextResponse.json({ ok: true, messageId: sendRes.MessageID });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}