export function buildConsultantRejectedEmail({ consultantName, editUrl, notes }) {
  const Subject = "Your MineLink profile needs changes";
  const safeNotes = (notes || "").trim();

  const HtmlBody = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b1736;color:#e6f2ff;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#0e1b48;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <h1 style="margin:0;font-size:18px;color:#fff">MineLink</h1>
        </div>
        <div style="padding:20px">
          <p style="margin:0 0 12px">Hi${consultantName ? ` ${consultantName}` : ""},</p>
          <p style="margin:0 0 12px">Thanks for submitting your profile. We’ve reviewed it and need a few changes before approval.</p>

          ${
            safeNotes
              ? `<div style="margin:14px 0;padding:12px;border:1px solid rgba(255,255,255,0.12);border-radius:10px;background:rgba(14,27,72,0.5)">
                   <p style="margin:0 0 6px;font-weight:700">Reviewer notes</p>
                   <p style="margin:0;white-space:pre-wrap;line-height:1.5">${safeNotes.replace(/</g, "&lt;")}</p>
                 </div>`
              : ""
          }

          <a href="${editUrl}" style="display:inline-block;background:#0ea5e9;color:#0b1736;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:999px">Edit your profile</a>

          <div style="margin-top:20px;color:#b3c6ff;font-size:13px;line-height:1.55">
            <p style="margin:0 0 8px"><strong>YouMine</strong> helps mining clients discover and contact specialist consultants. We’re here to help you get approved quickly.</p>
            <p style="margin:0">If you’d like assistance, email <a href="mailto:info@youmine.com.au" style="color:#9bd4ff">info@youmine.com.au</a>.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const TextBody = `Hi${consultantName ? ` ${consultantName}` : ""},

Thanks for submitting your profile. We need a few changes before approval.

${safeNotes ? `Reviewer notes:\n${safeNotes}\n\n` : ""}Edit your profile: ${editUrl}

If you’d like assistance, email info@youmine.com.au.

YouMine helps mining clients discover and contact specialist consultants.
`;

  return { Subject, HtmlBody, TextBody };
}