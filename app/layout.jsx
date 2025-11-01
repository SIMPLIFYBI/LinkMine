import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import AuthProvider from "@/app/components/AuthProvider";
import TradingViewTicker from "@/app/components/TradingViewTicker";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: { default: "YouMine", template: "%s · YouMine " },
  // keep viewport OUT of metadata; it belongs in app/viewport.js
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body
        className="
          min-h-screen supports-[height:100dvh]:min-h-[100dvh]
          flex flex-col
          bg-gradient-to-b from-[#0a1b3f] to-[#0b234f]
          text-slate-100 antialiased
        "
      >
        <AuthProvider>
          <Header />
          <TradingViewTicker />
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