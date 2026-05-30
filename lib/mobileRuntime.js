import { redirectTo } from "@/lib/siteUrl";

function getCapacitorBridge() {
  if (typeof window === "undefined") return null;
  return window.Capacitor || null;
}

export function isNativeAppRuntime() {
  const bridge = getCapacitorBridge();
  if (!bridge) return false;

  if (typeof bridge.isNativePlatform === "function") {
    return bridge.isNativePlatform();
  }

  if (typeof bridge.getPlatform === "function") {
    const platform = bridge.getPlatform();
    return Boolean(platform && platform !== "web");
  }

  return false;
}

export function getNativeAppAuthUrl() {
  const rawScheme = String(process.env.NEXT_PUBLIC_MOBILE_APP_URL_SCHEME || "").trim();
  if (!rawScheme) return null;

  const normalizedScheme = rawScheme.replace(/:\/\/?$/, "");
  return `${normalizedScheme}://auth`;
}

export function getAuthRedirectUrl() {
  if (isNativeAppRuntime()) {
    return getNativeAppAuthUrl() || redirectTo("/auth");
  }

  return redirectTo("/auth");
}

export function getAuthExchangeUrl(currentUrl) {
  return currentUrl || getAuthRedirectUrl();
}