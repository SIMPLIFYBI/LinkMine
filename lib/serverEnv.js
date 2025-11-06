import "server-only";
import { loadEnvConfig } from "@next/env";

let loaded = false;

export function ensureEnvLoaded() {
  if (!loaded) {
    // Load .env, .env.local, .env.development.local, etc. for the current cwd
    loadEnvConfig(process.cwd());
    loaded = true;
  }
}

export function getABRConfig() {
  ensureEnvLoaded();
  const ENDPOINT = process.env.ABR_ENDPOINT || "https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx";
  const GUID = process.env.ABR_GUID || "";
  const TIMEOUT_MS = Number(process.env.ABR_TIMEOUT_MS || 8000);
  return { ENDPOINT, GUID, TIMEOUT_MS };
}