import "server-only";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const CACHE_TTL_MS = 15 * 60 * 1000;
const REPORT_WINDOWS = new Set([7, 30, 90]);

const reportCache = globalThis.__youmineGa4ReportCache || new Map();
globalThis.__youmineGa4ReportCache = reportCache;

function readConfig() {
  const propertyId = String(process.env.GA4_PROPERTY_ID || "").trim();
  const clientEmail = String(process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  const projectId = String(process.env.GOOGLE_PROJECT_ID || "").trim();
  let privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").trim();

  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

  if (!propertyId || !clientEmail || !projectId || !privateKey) {
    const error = new Error("GA4 reporting is not configured.");
    error.code = "GA4_NOT_CONFIGURED";
    throw error;
  }

  return { propertyId, clientEmail, projectId, privateKey };
}

function getClient(config) {
  return new BetaAnalyticsDataClient({
    projectId: config.projectId,
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
  });
}

function getMetricValue(row, index) {
  return Number(row?.metricValues?.[index]?.value || 0);
}

function getDimensionValue(row, index) {
  return row?.dimensionValues?.[index]?.value || "(not set)";
}

function asDate(value) {
  if (!/^\d{8}$/.test(value || "")) return value || "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function normaliseDays(value) {
  const days = Number(value);
  return REPORT_WINDOWS.has(days) ? days : 30;
}

function safeErrorDetails(error) {
  let message = String(error?.message || "Unknown Google Analytics API error.");
  const configuredKey = String(process.env.GOOGLE_PRIVATE_KEY || "").trim();
  const unquotedKey = configuredKey.replace(/^("[\s\S]*"|'[\s\S]*')$/, (value) => value.slice(1, -1));
  const normalizedKey = unquotedKey.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  const keyVariants = [
    configuredKey,
    unquotedKey,
    normalizedKey,
    normalizedKey.replace(/\n/g, "\\n"),
    JSON.stringify(normalizedKey),
  ].filter(Boolean);

  for (const keyVariant of keyVariants) {
    message = message.split(keyVariant).join("[redacted]");
  }
  message = message
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[redacted private key]")
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, "[redacted credential]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 500);

  return {
    code: String(error?.code || error?.status || "unknown").slice(0, 80),
    message,
  };
}

async function runNamedReport(client, name, request) {
  try {
    return await client.runReport(request);
  } catch (error) {
    console.error("[ga4-report] request failed", {
      report: name,
      ...safeErrorDetails(error),
    });
    throw error;
  }
}

async function runAnalyticsReport(days) {
  const config = readConfig();
  const client = getClient(config);
  const property = `properties/${config.propertyId}`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  const [overviewResponse, signupResponse, trendResponse, countryResponse, acquisitionResponse, pagesResponse] = await Promise.all([
    runNamedReport(client, "overview", {
      property,
      dateRanges,
      metrics: [
        { name: "activeUsers" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
    }),
    runNamedReport(client, "signups", {
      property,
      dateRanges,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "sign_up" },
        },
      },
    }),
    runNamedReport(client, "daily-trend", {
      property,
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date", orderType: "ALPHANUMERIC" } }],
    }),
    runNamedReport(client, "countries", {
      property,
      dateRanges,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 10,
    }),
    runNamedReport(client, "acquisition", {
      property,
      dateRanges,
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }, { name: "sessionCampaignName" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 20,
    }),
    runNamedReport(client, "top-pages", {
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
  ]);

  const overview = overviewResponse[0]?.rows?.[0];
  const signups = getMetricValue(signupResponse[0]?.rows?.[0], 0);
  const activeUsers = getMetricValue(overview, 0);

  return {
    days,
    generatedAt: new Date().toISOString(),
    overview: {
      activeUsers,
      totalUsers: getMetricValue(overview, 1),
      newUsers: getMetricValue(overview, 2),
      sessions: getMetricValue(overview, 3),
      pageViews: getMetricValue(overview, 4),
      averageSessionDuration: getMetricValue(overview, 5),
      signups,
      signupRate: activeUsers ? signups / activeUsers : 0,
    },
    trend: (trendResponse[0]?.rows || []).map((row) => ({
      date: asDate(getDimensionValue(row, 0)),
      activeUsers: getMetricValue(row, 0),
      newUsers: getMetricValue(row, 1),
      sessions: getMetricValue(row, 2),
      pageViews: getMetricValue(row, 3),
    })),
    countries: (countryResponse[0]?.rows || []).map((row) => ({
      country: getDimensionValue(row, 0),
      activeUsers: getMetricValue(row, 0),
      pageViews: getMetricValue(row, 1),
    })),
    acquisition: (acquisitionResponse[0]?.rows || []).map((row) => ({
      source: getDimensionValue(row, 0),
      medium: getDimensionValue(row, 1),
      campaign: getDimensionValue(row, 2),
      sessions: getMetricValue(row, 0),
      activeUsers: getMetricValue(row, 1),
    })),
    topPages: (pagesResponse[0]?.rows || []).map((row) => ({
      path: getDimensionValue(row, 0),
      pageViews: getMetricValue(row, 0),
      activeUsers: getMetricValue(row, 1),
    })),
  };
}

export async function getGa4Report(requestedDays) {
  const days = normaliseDays(requestedDays);
  const cached = reportCache.get(days);

  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const data = await runAnalyticsReport(days);
  reportCache.set(days, { createdAt: Date.now(), data });
  return data;
}