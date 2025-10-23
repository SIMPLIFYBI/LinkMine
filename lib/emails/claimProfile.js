export function buildClaimProfileHtml(consultantName, claimUrl) {
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
            <h2 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:#ffffff;">Confirm ownership</h2>
            <p style="margin:0 0 16px;color:#c9d6e5;">Confirm you own <strong style="color:#ffffff;">${consultantName}</strong> by clicking the button below.</p>
            <p style="margin:0 0 18px;">
              <a href="${claimUrl}" style="display:inline-block;background:linear-gradient(90deg,#0ea5e9,#6366f1);color:#0b1220;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:999px;">Claim profile</a>
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#9fb3c8;">Or paste this link in your browser:</p>
            <p style="margin:0;word-break:break-all;"><a href="${claimUrl}" style="color:#7dd3fc;text-decoration:underline;">${claimUrl}</a></p>
          </div>
          <p style="margin:12px 4px 0 4px;font-size:12px;color:#9fb3c8;">You’re receiving this because someone requested a claim for this profile. If this wasn’t you, you can ignore this email.</p>
        </td></tr>
      </table>
    </body>
  </html>`.trim();
}

export function buildClaimProfileText(consultantName, claimUrl) {
  return `Confirm ownership of ${consultantName}

${claimUrl}

If you didn't request this, you can ignore this email.`;
}