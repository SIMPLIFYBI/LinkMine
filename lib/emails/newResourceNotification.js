import { buildEmailLayout, emailButton, emailDetails } from "./emailLayout";

export const NEW_RESOURCE_SUBJECT = (title) =>
  `New resource created on YouMine: ${title}`;

export function buildNewResourceHtml({ title, resourceId, resourceType, resourceFormat, status, createdBy, createdAt, siteUrl }) {
  const resourceUrl = `${siteUrl}/vault/${encodeURIComponent(resourceId || "")}`;
  return buildEmailLayout({ eyebrow: "Admin alert", title: "New resource created", preheader: `A new Vault resource was created: ${title}.`, content: `<p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">A new resource has been created in the Vault.</p>${emailDetails([{ label: "Title", value: title }, { label: "Resource ID", value: resourceId }, { label: "Type", value: resourceType }, { label: "Format", value: resourceFormat }, { label: "Status", value: status }, { label: "Created by", value: createdBy?.email || createdBy?.name || "unknown" }, { label: "Created", value: createdAt }])}${emailButton({ href: resourceUrl, label: "Open resource" })}` });
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
