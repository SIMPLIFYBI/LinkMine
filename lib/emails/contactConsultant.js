export function buildContactConsultantEmail({
  consultantName,
  toEmail,
  subject,
  message,
  location,
  budget,
  profileUrl,
  sender,
}) {
  const safe = (s) => String(s || "");
  const HtmlBody = `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1736;padding:24px;color:#e6f0ff;font-family:Inter,Segoe UI,Arial,sans-serif">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#0f224d;border:1px solid rgba(255,255,255,0.12);border-radius:16px;box-shadow:0 10px 35px rgba(0,0,0,0.35);overflow:hidden">
          <tr><td style="padding:20px 24px;background:linear-gradient(90deg,#0ea5e9,#6366f1);color:#0b1736;font-weight:800;font-size:18px;letter-spacing:0.3px">YouMine</td></tr>
          <tr><td style="padding:24px">
            <h1 style="margin:0 0 8px 0;font-size:18px;color:#ffffff">New enquiry via YouMine</h1>
            <p style="margin:0 0 14px 0;font-size:14px;color:#bcd0ff">
              You have a new message for <strong style="color:#fff">${safe(consultantName)}</strong>.
            </p>

            <table style="width:100%;border-collapse:separate;border-spacing:0 8px">
              <tr>
                <td style="width:140px;color:#9fb4ff;font-size:12px;">From</td>
                <td style="color:#eaf1ff;font-size:14px;">${safe(sender.name)} &lt;${safe(sender.email)}&gt; ${sender.phone ? " · " + safe(sender.phone) : ""}</td>
              </tr>
              <tr>
                <td style="width:140px;color:#9fb4ff;font-size:12px;">Subject</td>
                <td style="color:#eaf1ff;font-size:14px;">${safe(subject)}</td>
              </tr>
              ${location ? `<tr><td style="color:#9fb4ff;font-size:12px;">Location</td><td style="color:#eaf1ff;font-size:14px;">${safe(location)}</td></tr>` : ""}
              ${budget ? `<tr><td style="color:#9fb4ff;font-size:12px;">Budget</td><td style="color:#eaf1ff;font-size:14px;">${safe(budget)}</td></tr>` : ""}
            </table>

            <div style="margin:16px 0 8px 0;color:#9fb4ff;font-size:12px;">Message</div>
            <div style="white-space:pre-wrap;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;color:#eaf1ff;font-size:14px;line-height:1.5;">
              ${safe(message).replace(/</g,"&lt;")}
            </div>

            <div style="margin-top:16px">
              <a href="${profileUrl}" style="display:inline-block;background:#0ea5e9;color:#0b1736;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:999px">Open profile</a>
            </div>

            <p style="margin-top:20px;color:#9fb4ff;font-size:12px;line-height:1.5">
              Sent via YouMine. Reply directly to the sender’s email to continue the conversation.
            </p>
          </td></tr>
        </table>
        <div style="color:#7f8fb8;font-size:11px;margin-top:10px">© ${new Date().getFullYear()} YouMine</div>
      </td>
    </tr>
  </table>`;
  const TextBody = `New enquiry via YouMine

Consultant: ${safe(consultantName)}
From: ${safe(sender.name)} <${safe(sender.email)}> ${sender.phone ? " · " + safe(sender.phone) : ""}
Subject: ${safe(subject)}
${location ? "Location: " + safe(location) : ""}
${budget ? "Budget: " + safe(budget) : ""}

Message:
${safe(message)}

Open profile: ${profileUrl}

Reply directly to the sender’s email to continue the conversation.
© ${new Date().getFullYear()} YouMine`;

  return { HtmlBody, TextBody };
}