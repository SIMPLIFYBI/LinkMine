import "server-only";
import { ServerClient } from "postmark";
import { siteUrl } from "@/lib/siteUrl";
import {
  buildConsultantListingIntroEmail,
  CONSULTANT_LISTING_REPLY_TO,
} from "./consultantListingIntro";

export async function sendConsultantListingIntro({ sb, consultantId, req }) {
  const { data, error } = await sb
    .rpc("reserve_consultant_listing_intro", { p_consultant_id: consultantId })
    .maybeSingle();

  if (error) {
    console.error("Could not reserve consultant listing email", { consultantId, code: error.code });
    return {
      emailStatus: "intro_failed",
      emailWarning: "Could not prepare the listing email. Check the server logs.",
    };
  }
  if (!data) return { emailStatus: "skipped" };

  const finish = async (messageId) => {
    const { error: finishError } = await sb.rpc("finish_consultant_listing_intro", {
      p_consultant_id: consultantId,
      p_attempt_id: data.attempt_id,
      p_message_id: messageId,
    });
    if (finishError) {
      console.error("Could not record consultant listing email result", {
        consultantId, messageId, code: finishError.code,
      });
    }
    return !finishError;
  };

  const token = process.env.POSTMARK_TOKEN || process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    await finish(null);
    return { emailStatus: "intro_failed", emailWarning: "The listing email requires Postmark configuration." };
  }

  const to = data.contact_email;
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) {
    await finish(null);
    return {
      emailStatus: "intro_failed",
      emailWarning: "Add a valid contact email and save the profile again to send the listing email.",
    };
  }

  const profileUrl = siteUrl(`/consultants/${consultantId}`, req);
  const email = buildConsultantListingIntroEmail({ consultantName: data.consultant_name, profileUrl });
  const fromEmail = process.env.POSTMARK_FROM_EMAIL || CONSULTANT_LISTING_REPLY_TO;
  const fromName = process.env.POSTMARK_FROM_NAME || "YouMine";
  let messageId;
  try {
    const result = await new ServerClient(token).sendEmail({
      ...email,
      From: `${fromName} <${fromEmail}>`,
      To: to,
      ...(to.toLowerCase() === CONSULTANT_LISTING_REPLY_TO ? {} : { Bcc: CONSULTANT_LISTING_REPLY_TO }),
      ReplyTo: CONSULTANT_LISTING_REPLY_TO,
      MessageStream: process.env.POSTMARK_STREAM || process.env.POSTMARK_MESSAGE_STREAM || "outbound",
      Tag: "consultant-listing-intro",
      Metadata: { consultant_id: consultantId },
    });
    messageId = result.MessageID;
  } catch (err) {
    console.error("Consultant listing email send failed", {
      consultantId, status: err?.statusCode, code: err?.code,
    });
    // A timeout or server error can happen after Postmark accepted the message.
    if (err?.statusCode >= 400 && err.statusCode < 500 && await finish(null)) {
      return {
        emailStatus: "intro_failed",
        emailWarning: "Postmark rejected the listing email. Check Postmark, then save this profile again to retry.",
      };
    }
  }

  if (messageId && await finish(messageId)) return { emailStatus: "sent_intro" };
  return {
    emailStatus: "intro_unconfirmed",
    emailWarning: "Could not confirm the listing email. Check Postmark activity before retrying.",
  };
}
