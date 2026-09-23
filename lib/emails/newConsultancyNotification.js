import { buildEmailLayout, emailButton, emailDetails } from "./emailLayout";

export const NEW_CONSULTANCY_SUBJECT = (name) =>
  `New consultancy created on YouMine: ${name}`;

export function buildNewConsultancyHtml({ name, slug, createdBy, createdAt, siteUrl }) {
  const profileUrl = `${siteUrl}/consultants/${encodeURIComponent(slug || "")}`;
  return buildEmailLayout({ eyebrow: "Admin alert", title: "New consultancy created", preheader: `A new consultancy profile was created: ${name}.`, content: `<p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">A new consultancy profile has been created on YouMine.</p>${emailDetails([{ label: "Name", value: name }, { label: "Created by", value: createdBy?.email || createdBy?.name || "unknown" }, { label: "Created", value: createdAt }])}${emailButton({ href: profileUrl, label: "Open profile" })}` });
}

export function buildNewConsultancyText({ name, slug, createdBy, createdAt, siteUrl }) {
  return `New consultancy created

Name: ${name}
Created by: ${createdBy?.email || createdBy?.name || "unknown"}
Created at: ${createdAt}

View: ${siteUrl}/consultants/${slug || ""}
`;
}