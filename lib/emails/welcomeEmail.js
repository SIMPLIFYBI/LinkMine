export const WELCOME_SUBJECT = "Welcome to YouMine — Your Consultancy Is Now Live 🚀";

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
        <h1 style="margin:0;font-size:24px;line-height:1.3;color:#ffffff;">Welcome to YouMine — Your Consultancy Is Now Live 🚀</h1>
      </header>

      <section style="background:#0f172a;border:1px solid #1f2a44;border-radius:12px;padding:24px;">
        <p style="margin:0 0 16px 0;color:#cbd5e1;">Hi ${name},</p>
        <p style="margin:0 0 16px 0;color:#cbd5e1;">
          Thanks for joining YouMine — we’re excited to have your consultancy on the platform!
        </p>
        <p style="margin:0 0 16px 0;color:#cbd5e1;">
          YouMine was built to help mining contractors and consultants get discovered more easily.
          By setting up your profile, you’ve taken the first step toward putting your capabilities in front of mining companies across Australia (and soon, globally).
        </p>

        <h2 style="margin:24px 0 12px 0;font-size:18px;color:#ffffff;">Here’s what you can do next to maximise your visibility:</h2>

        <div style="margin:0 0 12px 0;">
          <p style="margin:0 0 8px 0;"><strong>📌 Complete Your Portfolio</strong></p>
          <p style="margin:0;color:#cbd5e1;">Add project photos, descriptions, locations, and key achievements. Profiles with full portfolios appear higher in search and receive more engagement.</p>
        </div>

        <div style="margin:16px 0 12px 0;">
          <p style="margin:0 0 8px 0;"><strong>📌 Verify Your Details</strong></p>
          <ul style="margin:0;padding-left:20px;color:#cbd5e1;">
            <li style="margin:4px 0;">ABN/ACN for instant validation</li>
            <li style="margin:4px 0;">Google Business / Place ID so your consultancy is correctly mapped</li>
          </ul>
          <p style="margin:8px 0 0 0;color:#cbd5e1;">These help clients trust your business at a glance.</p>
        </div>

        <div style="margin:16px 0 12px 0;">
          <p style="margin:0 0 8px 0;"><strong>📌 Keep Your Services Updated</strong></p>
          <p style="margin:0;color:#cbd5e1;">Ensure your service categories reflect what you actually provide — this improves how often your profile appears in relevant searches.</p>
        </div>

        <div style="margin:16px 0 20px 0;">
          <p style="margin:0 0 8px 0;"><strong>📌 Stay Available</strong></p>
          <p style="margin:0;color:#cbd5e1;">Clients can contact you directly through the platform. We’ll notify you via email anytime someone reaches out.</p>
        </div>

        <div style="text-align:center;margin:28px 0 8px 0;">
          <a href="https://youmine.io/account" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:600;">
            Complete Your Profile
          </a>
        </div>

        <h3 style="margin:28px 0 8px 0;font-size:16px;color:#ffffff;">Need a Hand Getting Started?</h3>
        <p style="margin:0 0 6px 0;color:#cbd5e1;">If you’d like help setting up your profile or getting the most out of YouMine, you can reach us anytime:</p>
        <ul style="margin:8px 0 0 0;padding-left:20px;color:#cbd5e1;">
          <li style="margin:4px 0;">🔗 Website: <a href="https://youmine.io" style="color:#38bdf8;text-decoration:none;">youmine.io</a></li>
          <li style="margin:4px 0;">🔗 LinkedIn: <a href="https://linkedin.com/company/youmine" style="color:#38bdf8;text-decoration:none;">linkedin.com/company/youmine</a></li>
          <li style="margin:4px 0;">📧 Email: <a href="mailto:info@youmine.com.au" style="color:#38bdf8;text-decoration:none;">info@youmine.com.au</a></li>
        </ul>

        <p style="margin:24px 0 0 0;color:#cbd5e1;">Welcome to YouMine — we’re glad to have you onboard.</p>
      </section>

      <footer style="text-align:center;margin-top:20px;color:#94a3b8;font-size:12px;">
        <p style="margin:6px 0;">YouMine — The platform for mining consultants</p>
        <p style="margin:6px 0;">© 2025 YouMine. All rights reserved.</p>
      </footer>
    </div>
  </body>
</html>`;
}

export function buildWelcomeEmailText({ firstName = "" }) {
  const name = firstName || "there";
  return `Welcome to YouMine — Your Consultancy Is Now Live 🚀

Hi ${name},

Thanks for joining YouMine — we’re excited to have your consultancy on the platform!

YouMine was built to help mining contractors and consultants get discovered more easily. By setting up your profile, you’ve taken the first step toward putting your capabilities in front of mining companies across Australia (and soon, globally).

Here’s what you can do next to maximise your visibility:

📌 Complete Your Portfolio
Add project photos, descriptions, locations, and key achievements. Profiles with full portfolios appear higher in search and receive more engagement.

📌 Verify Your Details
- ABN/ACN for instant validation
- Google Business / Place ID so your consultancy is correctly mapped
These help clients trust your business at a glance.

📌 Keep Your Services Updated
Ensure your service categories reflect what you actually provide — this improves how often your profile appears in relevant searches.

📌 Stay Available
Clients can contact you directly through the platform. We’ll notify you via email anytime someone reaches out.

Need a Hand Getting Started?
If you’d like help setting up your profile or getting the most out of YouMine, you can reach us anytime:

🔗 Website: youmine.io
🔗 LinkedIn: linkedin.com/company/youmine
📧 Email: info@youmine.com.au

Welcome to YouMine — we’re glad to have you onboard.`;
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}