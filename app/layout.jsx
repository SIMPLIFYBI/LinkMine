import React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";
import AuthProvider from "@/app/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: { default: "LinkMine", template: "%s · LinkMine" },
  viewport: { width: "device-width", initialScale: 1, viewportFit: "cover" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-gradient-to-b from-[#0a1b3f] to-[#0b234f] text-slate-100 antialiased">
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <MobileNav />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}