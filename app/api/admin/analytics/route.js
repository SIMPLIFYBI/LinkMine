import { NextResponse } from "next/server";
import { getGa4Report } from "@/lib/ga4Reporting";
import { getAnalyticsAdminContext } from "@/lib/adminAnalyticsAuth";

export const runtime = "nodejs";

export async function GET(request) {
  const admin = await getAnalyticsAdminContext();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  const days = new URL(request.url).searchParams.get("days") || "30";

  try {
    const report = await getGa4Report(days);
    return NextResponse.json(
      { ok: true, report },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    const isConfigurationError = error?.code === "GA4_NOT_CONFIGURED";
    return NextResponse.json(
      {
        ok: false,
        error: isConfigurationError
          ? "Google Analytics reporting has not been configured."
          : "Google Analytics reporting is temporarily unavailable.",
      },
      { status: isConfigurationError ? 503 : 502 }
    );
  }
}