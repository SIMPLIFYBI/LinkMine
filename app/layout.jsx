import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "MineLink",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Toaster position="top-right" />
        <Header />
        <main className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}