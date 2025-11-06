export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getABRConfig, ensureEnvLoaded } from "@/lib/serverEnv";

export async function GET() {
  ensureEnvLoaded();
  const { GUID, ENDPOINT, TIMEOUT_MS } = getABRConfig();

  const hasGuid = !!GUID && GUID.trim().length > 0;
  const endpoint = ENDPOINT || "(default)";
  const timeout = String(TIMEOUT_MS || "(default)");

  const cwd = process.cwd();
  const envLocalPath = path.join(cwd, ".env.local");
  const envExists = fs.existsSync(envLocalPath);

  return NextResponse.json({ hasGuid, endpoint, timeout, cwd, envLocalPath, envExists });
}