"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "youmine-theme";
const ThemeContext = createContext(null);

function normalizeTheme(value) {
  return value === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme);
  document.body?.setAttribute("data-theme", theme);

  const body = document.body;
  if (body) {
    if (theme === "light") {
      body.style.setProperty("--app-bg-solid", "#eef4f8");
      body.style.setProperty(
        "--app-bg-overlay",
        "radial-gradient(circle at 14% 18%, rgba(14, 165, 233, 0.14), transparent 28%), radial-gradient(circle at 84% 12%, rgba(99, 102, 241, 0.12), transparent 24%), radial-gradient(circle at 54% 82%, rgba(45, 212, 191, 0.12), transparent 30%), linear-gradient(180deg, #f8fbfd 0%, #edf4f8 42%, #e7eff6 100%)"
      );
      body.style.setProperty(
        "--app-bg-grid",
        "linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px)"
      );
      body.style.setProperty("--app-bg-grid-opacity", "0.5");
      body.style.setProperty(
        "--app-bg-vignette",
        "radial-gradient(circle at top, rgba(255, 255, 255, 0.72), transparent 42%)"
      );
      body.style.backgroundColor = "#eef4f8";
      body.style.backgroundImage =
        "var(--app-bg-vignette), var(--app-bg-overlay)";
      body.style.color = "#0f172a";
    } else {
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
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", theme === "light" ? "#eef4f8" : "#0ea5e9");
  }
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let nextTheme = "dark";

    try {
      nextTheme = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      nextTheme = "dark";
    }

    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures.
    }

    window.dispatchEvent(new CustomEvent("youmine-theme-change", { detail: theme }));
  }, [theme]);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== STORAGE_KEY) return;
      setTheme(normalizeTheme(event.newValue));
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      isLight: theme === "light",
      setTheme: (nextTheme) => setTheme(normalizeTheme(nextTheme)),
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light")),
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