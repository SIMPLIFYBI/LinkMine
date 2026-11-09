import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "@/lib/emails/emailLayout";

export function buildVaultCreatorClaimEmail({ creator, profileUrl, signupUrl, loginUrl }) {
  const name = creator.display_name || creator.company || "there";
  const subject = "Welcome to the YouMine Vault: your profile is ready";
  const text = [
    `Hi ${name},`, "", "Welcome to the YouMine Vault.", "",
    "The Vault is a directory that helps the mining community discover useful digital products, resources, and the creators behind them.",
    "We have created a profile for you and populated it with publicly available information so people can more easily discover your work.", "",
    `Your profile: ${profileUrl}`, "", "To review and claim ownership:", "1. Open your profile link.",
    `2. Create an account at ${signupUrl}, or log in at ${loginUrl} if you already have one.`,
    "3. Return to your profile and select Claim Profile.", "",
    "Once claimed, you can review and update the profile and resources yourself.",
    "If you would prefer not to be included in the Vault, reply to this email and we will remove the profile on request.", "",
    "Kind regards,", "The YouMine Team",
  ].join("\n");
  const html = buildEmailLayout({
    eyebrow: "YouMine Vault",
    title: "Welcome to the YouMine Vault",
    preheader: "Your creator profile is ready for review and claim.",
    content: `<p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(name)},</p><p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">The YouMine Vault is a directory that helps the mining community discover useful digital products, resources, and the creators behind them.</p><p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">We have created a profile for you and done our best to populate it with publicly available information, so people can more easily discover your work.</p>${emailPanel(`<div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8fe9ff;margin-bottom:8px;">Your profile</div><a href="${escapeHtml(profileUrl)}" style="color:#8fe9ff;font-size:14px;font-weight:700;word-break:break-word;">${escapeHtml(profileUrl)}</a>`)}${emailButton({ href: profileUrl, label: "Review and claim your profile" })}<p style="margin:4px 0 0;color:#91abc0;font-size:13px;line-height:1.6;">Create an account or log in first, then return to your profile and select Claim Profile. Once claimed, you can review and update it yourself.</p><p style="margin:18px 0 0;color:#d8e7f4;font-size:14px;line-height:1.65;">Would you prefer not to be included? Reply to this email and we will remove your profile on request.</p>`,
  });
  return { subject, text, html };
}