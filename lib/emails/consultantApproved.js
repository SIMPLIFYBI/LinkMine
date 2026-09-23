import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "./emailLayout";

export function buildConsultantApprovedEmail({ consultantName, profileUrl }) {
  const Subject = "Your YouMine profile is approved";
  const safeName = consultantName ? ` ${escapeHtml(consultantName)}` : "";
  const HtmlBody = buildEmailLayout({ eyebrow: "Profile review", title: "Your profile is live", preheader: "Your YouMine profile has been approved.", content: `<p style="margin:0 0 16px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi${safeName},</p><p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">Good news. Your profile has been approved and is now visible on YouMine.</p>${emailButton({ href: profileUrl, label: "View my profile" })}${emailPanel(`<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:9px;">Keep building momentum</div><ul style="margin:0;padding-left:20px;color:#c7d9e9;font-size:14px;line-height:1.7;"><li>Add a square logo and complete your headline.</li><li>Publish one to three portfolio examples.</li><li>Check your location, headline and contact email.</li></ul>`, { tone: "success" })}` });
  const TextBody = `Hi${consultantName ? ` ${consultantName}` : ""},

Good news — your profile has been approved and is now live.

Quick next steps:
• Add a square logo
• Publish 1–3 portfolio photos with notes
• Check location, headline and contact email

View your profile: ${profileUrl}

YouMine connects the mining industry — bringing together people, opportunities, expertise and digital tools in one place.`;
  return { Subject, HtmlBody, TextBody };
}