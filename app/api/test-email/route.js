export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailPostmark";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to");
    const subject = searchParams.get("subject") || "LinkMine test email";
    if (!to) {
      return NextResponse.json({ ok: false, error: "Missing ?to=email@example.com" }, { status: 400 });
    }
    const result = await sendEmail({
      to,
      subject,
      text: "This is a test email from LinkMine.",
      html: "<p>This is a <b>test</b> email from LinkMine.</p>",
    });
    return NextResponse.json({ ok: true, messageId: result.MessageID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}