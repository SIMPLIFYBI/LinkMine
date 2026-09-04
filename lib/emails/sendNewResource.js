import { sendEmail } from "@/lib/emailPostmark";
import { siteUrl } from "@/lib/siteUrl";
import {
  NEW_RESOURCE_SUBJECT,
  buildNewResourceHtml,
  buildNewResourceText,
} from "./newResourceNotification";

export async function sendNewResourceNotification({ resource, createdBy }) {
  const subject = NEW_RESOURCE_SUBJECT(resource.title || "New resource");
  const html = buildNewResourceHtml({
    title: resource.title || "",
    resourceId: resource.id || "",
    resourceType: resource.resource_type || resource.resourceType || "unknown",
    resourceFormat: resource.resource_format || resource.resourceFormat || "unknown",
    status: resource.status || "draft",
    createdBy,
    createdAt: resource.created_at || new Date().toISOString(),
    siteUrl: siteUrl(""),
  });

  const text = buildNewResourceText({
    title: resource.title || "",
    resourceId: resource.id || "",
    resourceType: resource.resource_type || resource.resourceType || "unknown",
    resourceFormat: resource.resource_format || resource.resourceFormat || "unknown",
    status: resource.status || "draft",
    createdBy,
    createdAt: resource.created_at || new Date().toISOString(),
    siteUrl: siteUrl(""),
  });

  await sendEmail({
    to: "info@youmine.com.au",
    subject,
    html,
    text,
  });
}
