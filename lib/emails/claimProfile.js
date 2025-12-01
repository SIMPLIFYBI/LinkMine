import { shortClaimCodeFromToken } from "@/lib/claimCode";

export function buildClaimProfileHtml(consultantName, enterCodeUrl, token) {
  const code = shortClaimCodeFromToken(token);
  return `<!doctype html><html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0b1220;color:#e6edf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding:24px;">
      <h2 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Claim your profile</h2>
      <p style="margin:0 0 14px;color:#c9d6e5;">Enter this code for <strong style="color:#ffffff;">${consultantName}</strong>:</p>
      <p style="margin:0 0 18px;font-size:24px;font-weight:700;letter-spacing:2px;color:#ffffff;">${code}</p>
      <p style="margin:0 0 18px;" align="left">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${enterCodeUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="50%" stroke="f" fillcolor="#0ea5e9">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:Segoe UI, Arial, sans-serif;font-size:14px;font-weight:700;">Enter code</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${enterCodeUrl}"
           style="display:inline-block;background-color:#0ea5e9;background-image:linear-gradient(90deg,#0ea5e9,#6366f1);color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:1;padding:12px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.18);">
          Enter code
        </a>
        <!--<![endif]-->
      </p>
      <p style="margin:0 0 10px;font-size:12px;color:#9fb3c8;">
        If you can’t see the button, copy and paste this link:<br/>
        <a href="${enterCodeUrl}" style="color:#7dd3fc;text-decoration:underline;">${enterCodeUrl}</a>
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