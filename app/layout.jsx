import React, { Suspense } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import AuthProvider from "@/app/components/AuthProvider";
import ConditionalTicker from "@/app/components/ConditionalTicker.client";
import Footer from "./components/Footer";
import Script from "next/script";
import GA4 from "@/app/components/GA4.client";
import ThemeProvider from "@/app/components/ThemeProvider";
import NativeAppUrlListener from "@/app/components/NativeAppUrlListener.client";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

function getMetadataBase() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://youmine.io";

  try {
    return new URL(baseUrl);
  } catch {
    return new URL("https://youmine.io");
  }
}

export const metadata = {
  metadataBase: getMetadataBase(),
  title: { default: "YouMine", template: "%s · YouMine " },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const enableAnalytics = GA_ID && process.env.NODE_ENV === "production";

async function getHeaderContext() {
  const { market, isAdmin } = await getResolvedSiteMarket();
  return { currentMarket: market, isAdmin };
}

export default async function RootLayout({ children }) {
  const { currentMarket, isAdmin } = await getHeaderContext();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg?v=1" type="image/svg+xml" />
        <meta name="theme-color" content="#0ea5e9" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem("youmine-theme") === "light" ? "light" : "dark";
                  document.documentElement.setAttribute("data-theme", theme);
                } catch (error) {
                  document.documentElement.setAttribute("data-theme", "dark");
                }
              })();
            `,
          }}
        />
      </head>
      <body
        data-market={currentMarket}
        className="
          min-h-screen supports-[height:100dvh]:min-h-[100dvh]
          flex flex-col
          text-slate-100 antialiased transition-colors duration-300
        "
      >
        {enableAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = window.gtag || gtag;
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { anonymize_ip: true });
                `,
              }}
            />
            <Suspense fallback={null}>
              <GA4 measurementId={GA_ID} />
            </Suspense>
          </>
        )}
        <ThemeProvider>
          <AuthProvider>
            <NativeAppUrlListener />
            <Header currentMarket={currentMarket} isAdmin={isAdmin} />
            <ConditionalTicker />
            <main className="flex-1">{children}</main>
            <Footer currentMarket={currentMarket} />
            <MobileNav />
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}