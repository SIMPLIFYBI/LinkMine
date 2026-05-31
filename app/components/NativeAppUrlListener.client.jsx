"use client";

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { getInAppNavigationPathFromUrl, isNativeAppRuntime } from "@/lib/mobileRuntime";

export default function NativeAppUrlListener() {
  useEffect(() => {
    if (!isNativeAppRuntime()) return undefined;

    let cancelled = false;

    async function wireNativeUrls() {
      const launchUrl = await CapacitorApp.getLaunchUrl();
      if (cancelled) return;

      const launchPath = getInAppNavigationPathFromUrl(launchUrl?.url);
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (launchPath && currentPath !== launchPath) {
        window.location.replace(launchPath);
      }
    }

    wireNativeUrls();

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      const nextPath = getInAppNavigationPathFromUrl(url);
      if (!nextPath) return;

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentPath === nextPath) return;
      window.location.replace(nextPath);
    });

    return () => {
      cancelled = true;
      listenerPromise.then((listener) => listener.remove()).catch(() => {});
    };
  }, []);

  return null;
}