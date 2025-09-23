export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";
export const redirectTo = (path = "/") => `${siteUrl}${path}`;