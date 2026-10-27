export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailButton({ href, label, secondary = false }) {
  const styles = secondary
    ? "border:1px solid #315b78;background:#143b57;background-image:linear-gradient(#143b57,#143b57);color:#ffffff;"
    : "border:1px solid #0b5f8d;background:#0b5f8d;background-image:linear-gradient(#0b5f8d,#0b5f8d);color:#ffffff;";

  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 18px;border-radius:10px;${styles}text-decoration:none;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:20px;">${escapeHtml(label)}</a>`;
}

export function emailPanel(content, { tone = "default" } = {}) {
  const background = tone === "attention" ? "#12283b" : tone === "success" ? "#102b2b" : "#0a1b2c";
  const border = tone === "attention" ? "#315b78" : tone === "success" ? "#235c5a" : "#1d3a55";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${background}" style="margin:0 0 20px;border:1px solid ${border};border-radius:14px;background:${background};background-image:linear-gradient(${background},${background});"><tr><td bgcolor="${background}" style="padding:18px 20px;background:${background};background-image:linear-gradient(${background},${background});">${content}</td></tr></table>`;
}

export function emailDetails(rows) {
  const renderedRows = rows
    .filter((row) => row?.label && row?.value)
    .map((row) => `<tr><td style="width:120px;padding:0 12px 8px 0;color:#8fb2cd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;">${escapeHtml(row.label)}</td><td style="padding:0 0 8px;color:#e5f1fb;font-size:14px;line-height:1.55;vertical-align:top;">${row.html ? row.value : escapeHtml(row.value)}</td></tr>`)
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderedRows}</table>`;
}

export function buildEmailLayout({ eyebrow = "YouMine", title, preheader = "", content, footerNote = "" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: dark; supported-color-schemes: dark; }
      body, .email-background { background-color:#06111d !important; color:#d9e8f5 !important; }
      .email-card { background-color:#091a2b !important; }
      .email-footer { background-color:#071524 !important; }
      [data-ogsc] .email-background { background-color:#06111d !important; }
      [data-ogsc] .email-card { background-color:#091a2b !important; }
      [data-ogsc] .email-footer { background-color:#071524 !important; }
    </style>
  </head>
  <body class="email-background" style="margin:0;padding:0;background:#06111d;background-image:linear-gradient(#06111d,#06111d);color:#d9e8f5;font-family:Segoe UI,Helvetica,Arial,sans-serif;" bgcolor="#06111d">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table class="email-background" role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#06111d" style="width:100%;background:#06111d;background-image:linear-gradient(#06111d,#06111d);padding:28px 12px;">
      <tr>
        <td align="center">
          <table class="email-card" role="presentation" width="640" cellpadding="0" cellspacing="0" bgcolor="#091a2b" style="width:100%;max-width:640px;border:1px solid #1c3851;border-radius:20px;overflow:hidden;background:#091a2b;background-image:linear-gradient(#091a2b,#091a2b);box-shadow:0 24px 56px rgba(0,0,0,.38);">
            <tr>
              <td bgcolor="#0b5f8d" style="padding:22px 24px 20px;background:#0b5f8d;background-image:linear-gradient(#0b5f8d,#0b5f8d);color:#e6f9ff;">
                <div style="font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#b8f3ff;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:9px 0 0;font-size:27px;line-height:1.18;font-weight:800;color:#ffffff;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td bgcolor="#091a2b" style="padding:26px 24px 16px;background:#091a2b;background-image:linear-gradient(#091a2b,#091a2b);">${content}</td>
            </tr>
            <tr>
              <td class="email-footer" bgcolor="#071524" style="padding:15px 24px 18px;border-top:1px solid #19334b;background:#071524;background-image:linear-gradient(#071524,#071524);color:#b5c9da;font-size:12px;line-height:1.55;text-align:center;">
                ${footerNote ? `${footerNote}<br />` : ""}YouMine connects industry expertise, opportunities, and digital tools.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
