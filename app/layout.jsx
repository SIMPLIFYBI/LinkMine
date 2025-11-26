import React, { Suspense } from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import AuthProvider from "@/app/components/AuthProvider";
import TradingViewTicker from "@/app/components/TradingViewTicker";
import Footer from "./components/Footer";
import Script from "next/script";
import GA4 from "@/app/components/GA4.client";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: { default: "YouMine", template: "%s · YouMine " },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const enableAnalytics = GA_ID && process.env.NODE_ENV === "production";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* add favicon */}
        <link rel="icon" href="/favicon.svg" />
        {/* optional PNG fallback for older clients */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" /> */}
      </head>
      <body
        className="
          min-h-screen supports-[height:100dvh]:min-h-[100dvh]
          flex flex-col
          bg-gradient-to-b from-[#0a1b3f] to-[#0b234f]
          text-slate-100 antialiased
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

        <AuthProvider>
          <Header />
          <div className="relative">
            <TradingViewTicker />
            <div
              aria-hidden="true"
              className="absolute -bottom-px left-0 h-px w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
            />
          </div>
          <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}