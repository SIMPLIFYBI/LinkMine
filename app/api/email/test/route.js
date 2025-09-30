export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ServerClient } from "postmark";

function getClient() {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN is missing");
  }
  return new ServerClient(token);
}

function getFrom() {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is missing");
  }
  return from;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to") || getFrom();
    const subject = searchParams.get("subject") || "Postmark test (GET)";
    const text = searchParams.get("text") || "Hello from Postmark via Next.js";

    const client = getClient();
    const result = await client.sendEmail({
      From: getFrom(),
      To: to,
      Subject: subject,
      TextBody: text,
      MessageStream: "outbound",
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = body.to || getFrom();
    const subject = body.subject || "Postmark test (POST)";
    const text = body.text || "Hello from Postmark via Next.js";

    const client = getClient();
    const result = await client.sendEmail({
      From: getFrom(),
      To: to,
      Subject: subject,
      TextBody: text,
      MessageStream: "outbound",
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}