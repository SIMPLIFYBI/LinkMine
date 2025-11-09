import { shortClaimCodeFromToken } from "@/lib/claimCode";

export function buildClaimProfileHtml(consultantName, claimUrl, token) {
  const code = shortClaimCodeFromToken(token);
  return `
  <!doctype html>
  <html>
    <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body style="margin:0;padding:0;background:#0b1220;color:#e6edf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;">
        <tr><td style="padding:24px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#6366f1);"></span>
            <strong style="font-size:18px;color:#ffffff;">YouMine</strong>
          </div>
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:20px;">
            <h2 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#ffffff;">Claim your profile</h2>
            <p style="margin:0 0 14px;color:#c9d6e5;">Use this claim code to verify ownership of <strong style="color:#ffffff;">${consultantName}</strong>:</p>
            <p style="margin:0 0 18px;font-size:24px;font-weight:700;letter-spacing:2px;color:#ffffff;">${code}</p>
            <p style="margin:0 0 16px;font-size:13px;color:#9fb3c8;">Go to the profile, click “Claim profile”, and enter the code above. Code expires in 30 minutes.</p>
            <p style="margin:0 0 6px;font-size:12px;color:#7dd3fc;">If the code entry isn’t working, you can still use this link:</p>
            <p style="margin:0;word-break:break-all;"><a href="${claimUrl}" style="color:#7dd3fc;text-decoration:underline;">${claimUrl}</a></p>
          </div>
          <p style="margin:12px 4px 0 4px;font-size:12px;color:#9fb3c8;">Didn’t request this? Ignore the email—no changes will occur.</p>
        </td></tr>
      </table>
    </body>
  </html>`.trim();
}

export function buildClaimProfileText(consultantName, claimUrl, token) {
  const code = shortClaimCodeFromToken(token);
  return `Claim your profile: ${consultantName}

Claim code: ${code}
Enter this code on the profile page (Claim profile).

If code entry fails you can still open:
${claimUrl}

If you didn't request this you can ignore the email.`;
}