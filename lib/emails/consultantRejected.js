import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "./emailLayout";

export function buildConsultantRejectedEmail({ consultantName, editUrl, notes }) {
  const Subject = "Your YouMine profile needs changes";
  const safeNotes = (notes || "").trim();

  const safeName = consultantName ? ` ${escapeHtml(consultantName)}` : "";
  const notesPanel = safeNotes ? emailPanel(`<div style="font-size:15px;font-weight:700;color:#ffffff;margin-bottom:7px;">Reviewer notes</div><div style="white-space:pre-wrap;color:#c7d9e9;font-size:14px;line-height:1.6;">${escapeHtml(safeNotes)}</div>`, { tone: "attention" }) : "";
  const HtmlBody = buildEmailLayout({ eyebrow: "Profile review", title: "Your profile needs a few changes", preheader: "Update your profile, then submit it again for review.", content: `<p style="margin:0 0 14px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi${safeName},</p><p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">Thanks for submitting your profile. We need a few changes before it can be approved.</p>${notesPanel}${emailButton({ href: editUrl, label: "Edit my profile" })}<p style="margin:4px 0 0;color:#91abc0;font-size:13px;line-height:1.55;">Need a hand? Reply to this email or contact <a href="mailto:info@youmine.com.au" style="color:#8fe9ff;">info@youmine.com.au</a>.</p>` });

  const TextBody = `Hi${consultantName ? ` ${consultantName}` : ""},

Thanks for submitting your profile. We need a few changes before approval.

${safeNotes ? `Reviewer notes:\n${safeNotes}\n\n` : ""}Edit your profile: ${editUrl}

If you’d like assistance, email info@youmine.com.au.

YouMine helps mining clients discover and contact specialist consultants.
`;

  return { Subject, HtmlBody, TextBody };
}