export function buildConsultantApprovedEmail({ consultantName, profileUrl }) {
  const Subject = "Your YouMine profile is approved";
  const HtmlBody = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b1736;color:#e6f2ff;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#0e1b48;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <h1 style="margin:0;font-size:18px;color:#fff">YouMine</h1>
        </div>
        <div style="padding:20px">
          <p style="margin:0 0 12px">Hi${consultantName ? ` ${consultantName}` : ""},</p>
          <p style="margin:0 0 12px">Good news — your profile has been approved and is now live.</p>
          <p style="margin:0 0 18px">You can keep improving your profile and portfolio any time.</p>
          <a href="${profileUrl}" style="display:inline-block;background:#0ea5e9;color:#0b1736;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:999px">View your profile</a>

          <div style="margin-top:22px;padding:14px;border:1px solid rgba(255,255,255,0.12);border-radius:10px;background:rgba(14,27,72,0.5)">
            <p style="margin:0 0 8px;font-weight:700">Quick next steps</p>
            <ul style="margin:0 0 0 18px;padding:0">
              <li>Add a square logo (PNG/JPG/WEBP)</li>
              <li>Publish 1–3 portfolio photos with short notes</li>
              <li>Check location, headline and contact email</li>
            </ul>
          </div>

          <div style="margin-top:20px;color:#b3c6ff;font-size:13px;line-height:1.55">
            <p style="margin:0 0 8px"><strong>YouMine</strong> helps mining clients discover and contact specialist consultants. Keep your profile fresh for better visibility.</p>
            <p style="margin:0">Can’t click the button? Paste this link:<br/>
              <a href="${profileUrl}" style="color:#9bd4ff">${profileUrl}</a></p>
          </div>
        </div>
      </div>
    </div>
  `;
  const TextBody = `Hi${consultantName ? ` ${consultantName}` : ""},

Good news — your profile has been approved and is now live.

Quick next steps:
• Add a square logo
• Publish 1–3 portfolio photos with notes
• Check location, headline and contact email

View your profile: ${profileUrl}

YouMine helps mining clients discover and contact specialist consultants.`;
  return { Subject, HtmlBody, TextBody };
}