import "server-only";
import { ServerClient } from "postmark";

function getPostmark() {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.EMAIL_FROM;
  if (!token || !from) return { client: null, from, error: "Missing POSTMARK_SERVER_TOKEN or EMAIL_FROM" };
  return { client: new ServerClient(token), from, error: null };
}

export async function sendEmail({ to, subject, html, text }) {
  const { client, from, error } = getPostmark();
  if (!client) {
    console.error("[postmark] not configured:", error);
    return { ok: false, error };
  }
  const res = await client.sendEmail({
    From: from,
    To: to,
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
    MessageStream: "outbound",
  });
  return { ok: true, id: res.MessageID };
}