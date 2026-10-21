"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

function applyTheme() {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", "dark");
  document.body?.setAttribute("data-theme", "dark");

  const body = document.body;
  if (body) {
    body.style.setProperty("--app-bg-solid", "#06111a");
    body.style.setProperty(
      "--app-bg-overlay",
      "radial-gradient(circle at 18% 16%, rgba(45, 212, 191, 0.22), transparent 26%), radial-gradient(circle at 78% 12%, rgba(14, 165, 233, 0.2), transparent 24%), radial-gradient(circle at 58% 78%, rgba(56, 189, 248, 0.12), transparent 32%), linear-gradient(160deg, #05111d 0%, #0c2231 42%, #10283c 72%, #071521 100%)"
    );
    body.style.setProperty(
      "--app-bg-grid",
      "linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px)"
    );
    body.style.setProperty("--app-bg-grid-opacity", "0.24");
    body.style.setProperty(
      "--app-bg-vignette",
      "radial-gradient(circle at top, rgba(255, 255, 255, 0.02), transparent 38%)"
    );
    body.style.backgroundColor = "#06111a";
    body.style.backgroundImage =
      "var(--app-bg-vignette), var(--app-bg-overlay)";
    body.style.color = "#e2e8f0";
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", "#0ea5e9");
  }
}

export default function ThemeProvider({ children }) {
  const [theme] = useState("dark");

  useEffect(() => {
    try {
      window.localStorage.removeItem("youmine-theme");
    } catch {
      // Ignore storage failures.
    }
    applyTheme();
  }, []);

  useEffect(() => {
    applyTheme();
    window.dispatchEvent(new CustomEvent("youmine-theme-change", { detail: theme }));
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      isLight: false,
      setTheme: () => {},
      toggleTheme: () => {},
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}