import { buildEmailLayout, emailButton, emailDetails, emailPanel, escapeHtml } from "./emailLayout";

const intentLabels = {
  role: "permanent role",
  contract: "contract opportunity",
  consulting: "consulting opportunity",
  exploratory: "exploratory conversation",
};

export function buildTalentConnectionRequestEmail({ candidateAlias, requester, intent, opportunityTitle, opportunityLocation, talentHubUrl }) {
  const requesterName = requester?.displayName || "A YouMine member";
  const opportunityType = intentLabels[intent] || "connection request";
  const details = emailDetails([
    { label: "From", value: requesterName },
    { label: "Company", value: requester?.companyName || "" },
    { label: "Role", value: requester?.roleTitle || "" },
    { label: "Interest", value: opportunityType },
    { label: "Opportunity", value: opportunityTitle || "" },
    { label: "Location", value: opportunityLocation || "" },
  ]);
  const safeAlias = candidateAlias || "there";
  const html = buildEmailLayout({
    eyebrow: "Talent Hub",
    title: "You have a new connection request",
    preheader: `${requesterName} would like to connect with you on YouMine.`,
    content: `<p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(safeAlias)}, <strong style="color:#ffffff;">${escapeHtml(requesterName)}</strong> would like to connect with you about a ${escapeHtml(opportunityType)}.</p>${emailPanel(details)}${emailButton({ href: talentHubUrl, label: "Review request in Talent Hub" })}<p style="margin:3px 0 0;color:#91abc0;font-size:12px;line-height:1.55;">You control whether to accept the request, and your contact details remain private unless you choose to share them.</p>`,
  });
  const text = `New Talent Hub connection request

Hi ${safeAlias},

${requesterName} would like to connect with you about a ${opportunityType}.
${requester?.companyName ? `Company: ${requester.companyName}\n` : ""}${requester?.roleTitle ? `Role: ${requester.roleTitle}\n` : ""}${opportunityTitle ? `Opportunity: ${opportunityTitle}\n` : ""}${opportunityLocation ? `Location: ${opportunityLocation}\n` : ""}
Review the request in Talent Hub: ${talentHubUrl}

You control whether to accept. Your contact details remain private unless you choose to share them.`;

  return {
    subject: "New Talent Hub connection request",
    html,
    text,
  };
}