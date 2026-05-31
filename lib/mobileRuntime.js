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
  const rawScheme = String(
    process.env.NEXT_PUBLIC_MOBILE_APP_URL_SCHEME ||
    process.env.CAPACITOR_APP_ID ||
    "io.youmine.app"
  ).trim();
  if (!rawScheme) return null;

  const normalizedScheme = rawScheme.replace(/:\/\/?$/, "");
  return `${normalizedScheme}://auth`;
}

export function getNativeAppUrlScheme() {
  const authUrl = getNativeAppAuthUrl();
  if (!authUrl) return null;

  try {
    return new URL(authUrl).protocol.replace(/:$/, "");
  } catch {
    return authUrl.replace(/:\/\/.*$/, "");
  }
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

export function getInAppNavigationPathFromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const nativeScheme = getNativeAppUrlScheme();
    const protocol = parsed.protocol.replace(/:$/, "");
    const host = (parsed.host || "").toLowerCase();
    const pathname = parsed.pathname || "";

    if (nativeScheme && protocol === nativeScheme && host === "auth") {
      return `/auth${parsed.search || ""}${parsed.hash || ""}`;
    }

    if (nativeScheme && protocol === nativeScheme && pathname.startsWith("/auth")) {
      return `${pathname}${parsed.search || ""}${parsed.hash || ""}`;
    }

    if ((protocol === "http" || protocol === "https") && pathname.startsWith("/auth")) {
      return `${pathname}${parsed.search || ""}${parsed.hash || ""}`;
    }
  } catch {
    return null;
  }

  return null;
}