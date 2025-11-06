export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const hasGuid = !!process.env.ABR_GUID && process.env.ABR_GUID.trim().length > 0;
  const endpoint = process.env.ABR_ENDPOINT || "(default)";
  const timeout = process.env.ABR_TIMEOUT_MS || "(default)";

  const cwd = process.cwd();
  const envLocalPath = path.join(cwd, ".env.local");
  const envExists = fs.existsSync(envLocalPath);

  return NextResponse.json({ hasGuid, endpoint, timeout, cwd, envLocalPath, envExists });
}