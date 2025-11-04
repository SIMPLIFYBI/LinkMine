export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import { supabaseRouteClient } from "@/lib/supabaseRouteClient";
import { supabaseFromRequest } from "@/lib/supabaseRequestClient";

export async function GET(req) {
  try {
    const hdrs = nextHeaders();
    const jar = await cookies();
    const cookieNames = jar.getAll().map((c) => c.name);
    const authHeader = hdrs.get("authorization") || req.headers.get("authorization") || "";

    // Check user via cookies (SSR client)
    const sbCookie = await supabaseRouteClient();
    const { data: cookieAuth } = await sbCookie.auth.getUser();

    // Check user via Authorization header (Bearer token)
    const sbHeader = supabaseFromRequest(req);
    const { data: headerAuth } = await sbHeader.auth.getUser();

    return NextResponse.json({
      ok: true,
      cookieNames,
      hasAuthHeader: !!authHeader,
      cookieUserId: cookieAuth?.user?.id || null,
      headerUserId: headerAuth?.user?.id || null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}