export const NEW_RESOURCE_SUBJECT = (title) =>
  `New resource created on YouMine: ${title}`;

export function buildNewResourceHtml({ title, resourceId, resourceType, resourceFormat, status, createdBy, createdAt, siteUrl }) {
  const resourceUrl = `${siteUrl}/vault/${encodeURIComponent(resourceId || "")}`;
  return `<!doctype html><html><body style="font-family:Inter,system-ui,Arial,sans-serif;color:#071026">
    <h2>New resource created</h2>
    <p>A new resource was created on YouMine:</p>
    <ul>
      <li><strong>Title:</strong> ${escapeHtml(title)}</li>
      <li><strong>Resource ID:</strong> ${escapeHtml(resourceId)}</li>
      <li><strong>Type:</strong> ${escapeHtml(resourceType)}</li>
      <li><strong>Format:</strong> ${escapeHtml(resourceFormat)}</li>
      <li><strong>Status:</strong> ${escapeHtml(status)}</li>
      <li><strong>Created by:</strong> ${escapeHtml(createdBy?.email || createdBy?.name || "unknown")}</li>
      <li><strong>Created at:</strong> ${escapeHtml(createdAt)}</li>
    </ul>
    <p>Open resource: <a href="${resourceUrl}">${resourceUrl}</a></p>
    </body></html>`;
}

export function buildNewResourceText({ title, resourceId, resourceType, resourceFormat, status, createdBy, createdAt, siteUrl }) {
  return `New resource created

Title: ${title}
Resource ID: ${resourceId}
Type: ${resourceType}
Format: ${resourceFormat}
Status: ${status}
Created by: ${createdBy?.email || createdBy?.name || "unknown"}
Created at: ${createdAt}

View: ${siteUrl}/vault/${resourceId || ""}
`;
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
