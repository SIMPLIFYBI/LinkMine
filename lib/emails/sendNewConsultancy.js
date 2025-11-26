import { sendEmail } from "@/lib/emailPostmark";
import { NEW_CONSULTANCY_SUBJECT, buildNewConsultancyHtml, buildNewConsultancyText } from "./newConsultancyNotification";
import { siteUrl } from "@/lib/siteUrl";

export async function sendNewConsultancyNotification({ consultancy, createdBy }) {
  const subject = NEW_CONSULTANCY_SUBJECT(consultancy.name || "New consultancy");
  const html = buildNewConsultancyHtml({
    name: consultancy.name || "",
    slug: consultancy.slug || consultancy.id || "",
    createdBy,
    createdAt: consultancy.created_at || new Date().toISOString(),
    siteUrl: siteUrl(""),
  });
  const text = buildNewConsultancyText({
    name: consultancy.name || "",
    slug: consultancy.slug || consultancy.id || "",
    createdBy,
    createdAt: consultancy.created_at || new Date().toISOString(),
    siteUrl: siteUrl(""),
  });

  // send to the admin inbox
  await sendEmail({
    to: "info@youmine.com.au",
    subject,
    html,
    text,
  });
}