import { NextResponse } from "next/server";
import { getAnalyticsAdminContext } from "@/lib/adminAnalyticsAuth";
import { getSearchConsoleReport } from "@/lib/searchConsoleReporting";
import { parseSearchConsoleParams } from "@/lib/searchConsoleParams.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request) {
  const admin = await getAnalyticsAdminContext();
  if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status, headers });
  try {
    const params = new URL(request.url).searchParams;
    const options = parseSearchConsoleParams(params);
    const report = await getSearchConsoleReport(options, params.get("refresh") === "1");
    return NextResponse.json({ ok: true, report }, { headers });
  } catch (error) {
    const failures = {
      INVALID_INPUT: [400, error.message],
      GSC_NOT_CONFIGURED: [503, "Google service account credentials are not configured."],
      GSC_PERMISSION: [403, "Search Console access was denied. Check the service account's property access and API configuration."],
      GSC_RATE_LIMIT: [429, "Search Console is rate-limited. Please try again later."],
    };
    const [status, message] = failures[error?.code] || [502, "Search Console reporting is temporarily unavailable."];
    if (status === 502) console.error("[search-console] reporting failed", { code: String(error?.code || error?.response?.status || "unknown").slice(0, 80) });
    return NextResponse.json({ ok: false, error: message }, { status, headers });
  }
}