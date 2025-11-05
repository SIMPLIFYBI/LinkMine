export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { ServerClient as Postmark } from "postmark";
import { siteUrl } from "@/lib/siteUrl";
import { buildContactConsultantEmail } from "@/lib/emails/contactConsultant";

const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN || process.env.POSTMARK_SERVER_TOKEN;
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "info@youmine.com.au";
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
      job_id = null, // optional linkage
      source = "contact_modal",
    } = body || {};

    if (!subject.trim() || !message.trim()) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    // Consultant must be public and approved to receive messages
    const { data: consultant, error: cErr } = await sb
      .from("consultants")
      .select("id, display_name, contact_email, visibility, status")
      .eq("id", consultantId)
      .maybeSingle();

    if (cErr || !consultant) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }
    if (consultant.visibility !== "public" || consultant.status !== "approved") {
      return NextResponse.json({ error: "Consultant is not publicly contactable" }, { status: 403 });
    }

    const toEmail = consultant.contact_email;
    if (!toEmail) {
      return NextResponse.json({ error: "Consultant has no contact email set" }, { status: 400 });
    }

    // Light rate-limit: same sender -> same consultant: max 3 in 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await sb
      .from("consultant_contacts")
      .select("id", { count: "exact", head: true })
      .eq("sender_user_id", user.id)
      .eq("consultant_id", consultantId)
      .gte("created_at", since24h);

    if (typeof recentCount === "number" && recentCount >= 3) {
      return NextResponse.json(
        { error: "You’ve reached the daily contact limit for this consultant. Please try again later." },
        { status: 429 }
      );
    }

    const profileUrl = siteUrl(`/consultants/${consultantId}`, req);
    const sender = {
      name: name?.trim() || user.user_metadata?.full_name || user.email,
      email: (email?.trim() || user.email || "").toLowerCase(),
      phone: (phone || "").trim(),
    };

    // Prepare context for analytics/trace
    const referrer = req.headers.get("referer") || null;
    const utm = {}; // you can parse UTM from referrer if needed

    // 1) Insert a 'pending' contact record first (system of record, even if email fails)
    const { data: inserted, error: insertErr } = await sb
      .from("consultant_contacts")
      .insert([
        {
          consultant_id: consultantId,
          sender_user_id: user.id,
          subject: subject.trim(),
          message: message.trim(),
          name: sender.name,
          email: sender.email,
          phone: sender.phone,
          location: (location || "").trim(),
          budget: (budget || "").trim(),
          job_id,
          status: "pending",
          source,
          referrer,
          utm,
          meta: {},
        },
      ])
      .select("id")
      .single();

    if (insertErr) {
      // If we can’t record it, don’t proceed with email to avoid “email sent but not recorded”
      return NextResponse.json({ error: "Failed to record contact" }, { status: 500 });
    }

    if (!POSTMARK_TOKEN || !FROM_EMAIL) {
      // Update stored row to failed
      await sb
        .from("consultant_contacts")
        .update({ status: "failed", delivery_provider: "postmark" })
        .eq("id", inserted.id)
        .eq("sender_user_id", user.id);
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const { HtmlBody, TextBody } = buildContactConsultantEmail({
      consultantName: consultant.display_name || "Consultant",
      toEmail,
      subject: subject.trim(),
      message: message.trim(),
      location: (location || "").trim(),
      budget: (budget || "").trim(),
      profileUrl,
      sender,
    });

    // 2) Attempt email send
    let messageId = null;
    try {
      const client = new Postmark(POSTMARK_TOKEN);
      const sendRes = await client.sendEmail({
        From: `${FROM_NAME} <${FROM_EMAIL}>`,
        To: toEmail,
        Subject: `YouMine enquiry: ${subject.trim()}`,
        HtmlBody,
        TextBody,
        MessageStream: "outbound",
        ReplyTo: sender.email,
        TrackOpens: true,
      });
      messageId = sendRes.MessageID || null;

      // 3) Mark as 'sent' and store provider trace id
      await sb
        .from("consultant_contacts")
        .update({
          status: "sent",
          delivery_provider: "postmark",
          delivery_message_id: messageId,
        })
        .eq("id", inserted.id)
        .eq("sender_user_id", user.id);

      return NextResponse.json({ ok: true, id: inserted.id, messageId });
    } catch (mailErr) {
      // email failed – record failure
      await sb
        .from("consultant_contacts")
        .update({
          status: "failed",
          delivery_provider: "postmark",
        })
        .eq("id", inserted.id)
        .eq("sender_user_id", user.id);

      console.error("Postmark send failed:", mailErr);
      return NextResponse.json({ error: "Failed to send message" }, { status: 502 });
    }
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}