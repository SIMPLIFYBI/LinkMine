export function getBaseUrl(req) {
  const normalize = (u) => (u ? String(u).replace(/\/+$/, "") : "");
  // Prefer env (works on Vercel + local)
  let envBase = normalize(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL);
  if (!envBase && process.env.VERCEL_URL) envBase = `https://${normalize(process.env.VERCEL_URL)}`;
  if (envBase) return envBase;

  // Fall back to request headers/origin
  let origin = "";
  try {
    const get = req?.headers?.get?.bind(req?.headers);
    const proto = get ? get("x-forwarded-proto") : null;
    const host = get ? (get("x-forwarded-host") || get("host")) : null;
    if (proto && host) origin = `${proto}://${host}`;
    else if (req?.url) origin = new URL(req.url).origin;
  } catch {}
  return origin || "https://www.youmine.com.au";
}

export function siteUrl(path = "", req) {
  const base = getBaseUrl(req);
  const p = String(path || "");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

export const redirectTo = (path = "/") => `${siteUrl(path)}`;