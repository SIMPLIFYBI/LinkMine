export const NEW_CONSULTANCY_SUBJECT = (name) =>
  `New consultancy created on YouMine: ${name}`;

export function buildNewConsultancyHtml({ name, slug, createdBy, createdAt, siteUrl }) {
  return `<!doctype html><html><body style="font-family:Inter,system-ui,Arial,sans-serif;color:#071026">
    <h2>New consultancy created</h2>
    <p>A new consultancy profile was created on YouMine:</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(name)}</li>
      <li><strong>Created by:</strong> ${escapeHtml(createdBy?.email || createdBy?.name || "unknown")}</li>
      <li><strong>Created at:</strong> ${escapeHtml(createdAt)}</li>
    </ul>
    <p>Open profile: <a href="${siteUrl}/consultants/${encodeURIComponent(slug || "")}">${siteUrl}/consultants/${encodeURIComponent(slug || "")}</a></p>
    </body></html>`;
}

export function buildNewConsultancyText({ name, slug, createdBy, createdAt, siteUrl }) {
  return `New consultancy created

Name: ${name}
Created by: ${createdBy?.email || createdBy?.name || "unknown"}
Created at: ${createdAt}

View: ${siteUrl}/consultants/${slug || ""}
`;
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}