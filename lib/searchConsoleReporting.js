import "server-only";
import { GoogleAuth } from "google-auth-library";
import { getGoogleServiceAccount } from "@/lib/googleServiceAccount";

const CACHE_TTL = 15 * 60 * 1000;
const cache = globalThis.__youmineSearchConsoleCache || new Map();
globalThis.__youmineSearchConsoleCache = cache;

async function runQuery(client, property, range, dimensions, filters) {
  const request = {
    startDate: range.start,
    endDate: range.end,
    type: "web",
    dataState: "final",
    dimensions,
    rowLimit: 1000,
    ...(Object.keys(filters).length ? { dimensionFilterGroups: [{ groupType: "and", filters: Object.entries(filters).map(([dimension, expression]) => ({ dimension, expression, operator: "equals" })) }] } : {}),
  };
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await client.request({ url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, method: "POST", data: request, timeout: 15000, retry: false });
      return response.data;
    } catch (error) {
      const status = Number(error?.response?.status || error?.status || 0);
      const reasons = error?.response?.data?.error?.errors || [];
      const limited = status === 429 || reasons.some((item) => ["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded"].includes(item.reason));
      if (attempt < 2 && (limited || status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, (250 * 2 ** attempt) + Math.random() * 150));
        continue;
      }
      if (limited) error.code = "GSC_RATE_LIMIT";
      else if (status === 403 || status === 401) error.code = "GSC_PERMISSION";
      throw error;
    }
  }
}

async function fetchReport(options) {
  const credentials = getGoogleServiceAccount();
  if (!credentials.clientEmail || !credentials.projectId || !credentials.privateKey) throw Object.assign(new Error("Search Console credentials are not configured."), { code: "GSC_NOT_CONFIGURED" });
  const auth = new GoogleAuth({ projectId: credentials.projectId, credentials: { client_email: credentials.clientEmail, private_key: credentials.privateKey }, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const property = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || "sc-domain:youmine.io";
  const current = { start: options.start, end: options.end };
  const previous = { start: options.previousStart, end: options.previousEnd };
  const requests = [[], ["date"], ["query"], ["page"], ["country"], ["device"]].map((dimensions) => runQuery(client, property, current, dimensions, options.filters));
  requests.push(runQuery(client, property, previous, [], options.filters));
  const [overview, trend, queries, pages, countries, devices, previousOverview] = await Promise.all(requests);
  return {
    ...options,
    generatedAt: new Date().toISOString(),
    overview: overview.rows?.[0] || null,
    previousOverview: previousOverview.rows?.[0] || null,
    trend: trend.rows || [],
    queries: queries.rows || [],
    pages: pages.rows || [],
    countries: countries.rows || [],
    devices: devices.rows || [],
    aggregation: overview.responseAggregationType,
    rowLimit: 1000,
  };
}

export async function getSearchConsoleReport(options, refresh = false) {
  const key = JSON.stringify(options);
  const existing = cache.get(key);
  if (!refresh && existing && existing.expires > Date.now()) return existing.promise;
  const promise = fetchReport(options);
  const entry = { expires: Date.now() + CACHE_TTL, promise };
  cache.set(key, entry);
  while (cache.size > 50) cache.delete(cache.keys().next().value);
  try {
    return await promise;
  } catch (error) {
    if (cache.get(key) === entry) cache.delete(key);
    throw error;
  }
}