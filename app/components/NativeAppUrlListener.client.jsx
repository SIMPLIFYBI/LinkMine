"use client";

import { useEffect } from "react";
import { getInAppNavigationPathFromUrl, isNativeAppRuntime } from "@/lib/mobileRuntime";

export default function NativeAppUrlListener() {
  useEffect(() => {
    if (!isNativeAppRuntime()) return undefined;

    let cancelled = false;
    let listenerPromise = Promise.resolve(null);

    async function wireNativeUrls() {
      const { App: CapacitorApp } = await import("@capacitor/app");
      if (cancelled) return;

      const launchUrl = await CapacitorApp.getLaunchUrl();
      if (cancelled) return;

      const launchPath = getInAppNavigationPathFromUrl(launchUrl?.url);
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (launchPath && currentPath !== launchPath) {
        window.location.replace(launchPath);
      }

      listenerPromise = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        const nextPath = getInAppNavigationPathFromUrl(url);
        if (!nextPath) return;

        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (currentPath === nextPath) return;
        window.location.replace(nextPath);
      });
    }

    wireNativeUrls();

    return () => {
      cancelled = true;
      listenerPromise.then((listener) => listener?.remove?.()).catch(() => {});
    };
  }, []);

  return null;
}