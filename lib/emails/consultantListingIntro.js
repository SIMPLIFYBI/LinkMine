import { buildEmailLayout, emailButton, escapeHtml } from "./emailLayout";

export const CONSULTANT_LISTING_REPLY_TO = "info@youmine.com.au";

export function buildConsultantListingIntroEmail({ consultantName, profileUrl }) {
  const name = consultantName?.trim();
  const subject = name ? `We’ve listed ${name} on YouMine` : "Your consultancy is listed on YouMine";
  const preheader = "See your free profile and what you can do with it.";
  const greeting = name ? `Hi ${name} team,` : "Hi there,";
  const intro = `We’ve added a free profile for ${name || "your consultancy"} on YouMine so mining and resources teams looking for your expertise can find you and get in touch directly.`;
  const platform = "YouMine brings together the people, work and tools that keep the resources industry moving. You can browse contract and freelance opportunities, promote your training and events, and discover or share industry tools and resources in the Vault.";
  const claiming = "If you’d like to manage how your business appears, select Claim this profile on your listing. It’s free to claim, and you can update your services and contact details, showcase past projects, and add courses and upcoming training sessions.";
  const closing = "You’re welcome to leave the profile as it is. If you’d like us to update or remove it, just reply to this email.";
  const paragraph = (value) => `<p style="margin:0 0 16px;color:#d8e7f4;font-size:15px;line-height:1.65;">${escapeHtml(value)}</p>`;

  return {
    Subject: subject,
    HtmlBody: buildEmailLayout({
      title: "Your consultancy is listed on YouMine",
      preheader,
      content: [
        paragraph(greeting),
        paragraph(intro),
        emailButton({ href: profileUrl, label: "View your profile" }),
        paragraph(platform),
        paragraph(claiming).replace("Claim this profile", "<strong>Claim this profile</strong>"),
        paragraph(closing),
        paragraph("Thanks,"),
        paragraph("The YouMine team"),
      ].join(""),
    }),
    TextBody: [
      greeting,
      intro,
      `View your profile: ${profileUrl}`,
      platform,
      claiming,
      closing,
      "Thanks,\nThe YouMine team",
    ].join("\n\n"),
  };
}
