export const WELCOME_SUBJECT = "Welcome to YouMine — Let’s get started";

export function buildWelcomeEmailHtml({ firstName = "" }) {
  const name = firstName ? escapeHtml(firstName) : "there";
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${WELCOME_SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b1220;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#E5E7EB;">
      <header style="text-align:left;margin-bottom:24px;">
        <h1 style="margin:0;font-size:24px;line-height:1.3;color:#ffffff;">Welcome to YouMine 👋</h1>
      </header>

      <section style="background:#0f172a;border:1px solid #1f2a44;border-radius:12px;padding:24px;">
        <p style="margin:0 0 16px 0;color:#cbd5e1;">Hi ${name},</p>
        <p style="margin:0 0 16px 0;color:#cbd5e1;">
          Thanks for creating an account with YouMine. We connect mining companies with trusted consultants and contractors — and make it easy to collaborate.
        </p>

        <h2 style="margin:24px 0 12px 0;font-size:18px;color:#ffffff;">Get started</h2>
        <ul style="margin:0 0 8px 0;padding-left:20px;color:#cbd5e1;">
          <li style="margin:6px 0;">Browse the marketplace and discover verified experts.</li>
          <li style="margin:6px 0;">Set up your profile and preferences to tailor your experience.</li>
          <li style="margin:6px 0;">Post a job or showcase your portfolio to get momentum quickly.</li>
        </ul>
      </section>

      <section style="margin-top:18px;background:#0f172a;border:1px solid #1f2a44;border-radius:12px;padding:20px;">
        <h3 style="margin:0 0 8px 0;font-size:16px;color:#ffffff;">For Clients</h3>
        <ul style="margin:0 12px 14px 20px;color:#cbd5e1;">
          <li style="margin:4px 0;">Post your job and receive interest from relevant consultants.</li>
          <li style="margin:4px 0;">Compare experience, portfolios, and availability.</li>
          <li style="margin:4px 0;">Contact providers directly and keep work moving.</li>
        </ul>
        <div style="margin:10px 0;">
          <a href="https://youmine.io/jobs?tab=my-jobs"
             style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
            Post a Job
          </a>
          <a href="https://youmine.io/consultants"
             style="display:inline-block;margin-left:10px;padding:12px 18px;border-radius:10px;background:#111827;color:#E5E7EB;text-decoration:none;font-weight:600;font-size:14px;border:1px solid #1f2a44;">
            Browse consultants
          </a>
        </div>
      </section>

      <section style="margin-top:18px;background:#0f172a;border:1px solid #1f2a44;border-radius:12px;padding:20px;">
        <h3 style="margin:0 0 8px 0;font-size:16px;color:#ffffff;">For Consultants</h3>
        <ul style="margin:0 12px 14px 20px;color:#cbd5e1;">
          <li style="margin:4px 0;">Complete your profile and add a portfolio to stand out.</li>
          <li style="margin:4px 0;">List services, locations, and specialties so clients can find you.</li>
          <li style="margin:4px 0;">Monitor interest and respond quickly to enquiries.</li>
        </ul>
        <div style="margin:10px 0;">
          <a href="https://youmine.io/account"
             style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
            Complete your profile
          </a>
          <a href="https://youmine.io/jobs"
             style="display:inline-block;margin-left:10px;padding:12px 18px;border-radius:10px;background:#111827;color:#E5E7EB;text-decoration:none;font-weight:600;font-size:14px;border:1px solid #1f2a44;">
            Explore jobs board
          </a>
        </div>
      </section>

      <footer style="text-align:center;margin-top:20px;color:#94a3b8;font-size:12px;">
        <p style="margin:6px 0;">YouMine — Built for the mining industry</p>
        <p style="margin:6px 0;">© 2025 YouMine. All rights reserved.</p>
      </footer>
    </div>
  </body>
</html>`;
}

export function buildWelcomeEmailText({ firstName = "" }) {
  const name = firstName || "there";
  return `Welcome to YouMine — Let’s get started

Hi ${name},

Thanks for creating an account with YouMine. We connect mining companies with trusted consultants and contractors.

Get started
- Browse the marketplace and discover verified experts.
- Set up your profile and preferences.
- Post a job or showcase your portfolio.

For Clients
- Post your job and receive interest from relevant consultants.
- Compare experience, portfolios, and availability.
- Contact providers directly.
CTA: https://youmine.io/jobs?tab=my-jobs
Browse consultants: https://youmine.io/consultants

For Consultants
- Complete your profile and add a portfolio.
- List services, locations, and specialties.
- Respond quickly to enquiries.
Complete profile: https://youmine.io/account
Explore jobs: https://youmine.io/jobs

© 2025 YouMine. Built for the mining industry.`;
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}