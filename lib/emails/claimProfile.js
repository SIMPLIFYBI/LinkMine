import { shortClaimCodeFromToken } from "@/lib/claimCode";

export function buildClaimProfileHtml(consultantName, enterCodeUrl, token) {
  const code = shortClaimCodeFromToken(token);
  return `<!doctype html><html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0b1220;color:#e6edf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:24px;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Claim your profile</h2>
      <p style="margin:0 0 14px;color:#c9d6e5;">Enter this code for <strong style="color:#fff;">${consultantName}</strong>:</p>
      <p style="margin:0 0 18px;font-size:24px;font-weight:700;letter-spacing:2px;color:#fff;">${code}</p>
      <p style="margin:0 0 14px;font-size:13px;color:#9fb3c8;">Code expires in 30 minutes.</p>
      <p style="margin:0 0 18px;">
        <a href="${enterCodeUrl}" style="display:inline-block;background:linear-gradient(90deg,#0ea5e9,#6366f1);color:#0b1220;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:999px;">Enter code</a>
      </p>
      <p style="margin:12px 4px 0;font-size:12px;color:#9fb3c8;">Didn’t request this? Ignore the email.</p>
    </td></tr>
  </table>
</body></html>`;
}

export function buildClaimProfileText(consultantName, enterCodeUrl, token) {
  const code = shortClaimCodeFromToken(token);
  return `Claim your profile: ${consultantName}

Claim code: ${code}
Enter code: ${enterCodeUrl}

If you didn't request this you can ignore the email.`;
}