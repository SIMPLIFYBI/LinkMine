import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "./emailLayout";

export function buildResourceApprovedEmail({ resourceTitle, resourceUrl }) {
  const safeTitle = escapeHtml(resourceTitle || "your resource");
  const Subject = "Congratulations, your resource is now live on YouMine";
  const HtmlBody = buildEmailLayout({
    eyebrow: "Vault review",
    title: "Your resource is now live",
    preheader: "Your resource has been approved and is ready to view on YouMine.",
    content: `<p style="margin:0 0 16px;color:#d8e7f4;font-size:15px;line-height:1.65;">Congratulations. <strong style="color:#ffffff;">${safeTitle}</strong> has been approved and is now live in the YouMine Vault.</p><p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">Use the link below to check it out. You will be asked to log in first if you are not already signed in.</p>${emailButton({ href: resourceUrl, label: "View my resource" })}${emailPanel("<div style=\"font-size:14px;line-height:1.6;color:#d8e7f4;\">You can return to your resource at any time to review it and keep its details up to date.</div>", { tone: "success" })}`,
  });
  const TextBody = `Congratulations,

${resourceTitle || "Your resource"} has been approved and is now live in the YouMine Vault.

View your resource: ${resourceUrl}

You will be asked to log in first if you are not already signed in.`;
  return { Subject, HtmlBody, TextBody };
}