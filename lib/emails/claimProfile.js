import { shortClaimCodeFromToken } from "@/lib/claimCode";
import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "./emailLayout";

export function buildClaimProfileHtml(consultantName, enterCodeUrl, token) {
  const code = shortClaimCodeFromToken(token);
  const content = `<p style="margin:0 0 16px;color:#d8e7f4;font-size:15px;line-height:1.65;">Use this verification code to claim <strong style="color:#ffffff;">${escapeHtml(consultantName)}</strong>.</p>${emailPanel(`<div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8fb2cd;">Claim code</div><div style="margin-top:8px;font-size:30px;font-weight:800;letter-spacing:.18em;color:#ffffff;">${escapeHtml(code)}</div>`, { tone: "attention" })}${emailButton({ href: enterCodeUrl, label: "Enter claim code" })}<p style="margin:2px 0 0;color:#91abc0;font-size:12px;line-height:1.55;">Did not request this claim? You can safely ignore this email.</p>`;
  return buildEmailLayout({ eyebrow: "Profile ownership", title: "Claim your profile", preheader: `Your claim code is ${code}.`, content });
}

export function buildClaimProfileText(consultantName, enterCodeUrl, token) {
  const code = shortClaimCodeFromToken(token);
  return `Claim your profile: ${consultantName}

Claim code: ${code}
Enter code: ${enterCodeUrl}

If you didn't request this you can ignore the email.`;
}