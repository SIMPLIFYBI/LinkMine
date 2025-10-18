export function getBaseUrl(req) {
  // 1) Prefer the current request origin (works for localhost + prod)
  let origin = "";
  if (req?.url) {
    try {
      origin = new URL(req.url).origin; // e.g. http://localhost:3004
    } catch {}
  }
  // 2) Otherwise use env, 3) final fallback to prod domain
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  return origin || envBase || "https://link-mine.vercel.app";
}

export function siteUrl(path = "", req) {
  const base = getBaseUrl(req);
  const p = String(path || "");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

export const redirectTo = (path = "/") => `${siteUrl(path)}`;