export const WELCOME_SUBJECT = "Welcome to YouMine";

export function buildWelcomeEmailHtml({
  firstName,
  completeProfileUrl,
  consultantsUrl,
  jobsUrl,
  supportEmail = "info@youmine.com.au",
}) {
  const hi = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";

  return `<!doctype html><html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-preheader" content="Get started on YouMine: complete your profile, discover consultants and explore mining jobs."/>
  </head>
<body style="margin:0;padding:0;background:#0b1220;color:#e6edf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:24px;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Welcome to YouMine</h2>
      <p style="margin:0 0 10px;color:#c9d6e5;">${hi}</p>
      <p style="margin:0 0 14px;color:#c9d6e5;">YouMine helps mining companies and professionals connect with trusted consultants, contractors and jobs. We list specialists — you engage them directly.</p>

      <div style="margin:18px 0;padding:14px 16px;border:1px solid rgba(148,163,184,0.2);border-radius:12px;background:rgba(255,255,255,0.03);">
        <p style="margin:0 0 8px;font-weight:700;color:#fff;">How it works</p>
        <ol style="margin:0 0 12px;padding-left:18px;color:#c9d6e5;line-height:1.55;">
          <li style="margin:6px 0;">Complete your profile so clients and consultants know who you are.</li>
          <li style="margin:6px 0;">Browse the directory to find consultants and contractors by specialty.</li>
          <li style="margin:6px 0;">Explore the jobs board or post roles to reach the community.</li>
          <li style="margin:6px 0;">Contact and contract directly — no marketplace middleman.</li>
        </ol>
      </div>

      <p style="margin:16px 0 18px;">
        <a href="${completeProfileUrl}" style="display:inline-block;background:linear-gradient(90deg,#0ea5e9,#6366f1);color:#0b1220;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:999px;">Complete your profile</a>
      </p>

      <p style="margin:12px 0 0;font-size:13px;color:#9fb3c8;">
        Or jump in: <a href="${consultantsUrl}" style="color:#93c5fd;text-decoration:none;">Find consultants</a> ·
        <a href="${jobsUrl}" style="color:#93c5fd;text-decoration:none;">Explore jobs</a>
      </p>

      <p style="margin:16px 0 0;font-size:12px;color:#9fb3c8;">Need help? Email us at <a href="mailto:${supportEmail}" style="color:#93c5fd;text-decoration:none;">${supportEmail}</a>.</p>
    </td></tr>
  </table>
</body></html>`;
}

export function buildWelcomeEmailText({
  firstName,
  completeProfileUrl,
  consultantsUrl,
  jobsUrl,
  supportEmail = "info@youmine.com.au",
}) {
  const hi = firstName ? `Hi ${firstName},` : "Hi there,";
  return `Welcome to YouMine

${hi}
YouMine helps mining companies and professionals connect with trusted consultants, contractors and jobs. We list specialists — you engage them directly.

How it works
1) Complete your profile
2) Find consultants and contractors
3) Explore the jobs board or post roles
4) Contact and contract directly

Start here: ${completeProfileUrl}
Find consultants: ${consultantsUrl}
Explore jobs: ${jobsUrl}

Need help? ${supportEmail}
`;
}

// Minimal HTML escape for names
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}