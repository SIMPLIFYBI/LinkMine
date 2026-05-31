import dotenv from "dotenv";
import type { CapacitorConfig } from "@capacitor/cli";

dotenv.config({ path: ".env.local" });
dotenv.config();

const serverUrl = String(
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  ""
).trim();

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || "io.youmine.app",
  appName: process.env.CAPACITOR_APP_NAME || "YouMine",
  webDir: "capacitor-shell",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;