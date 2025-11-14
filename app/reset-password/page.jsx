"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

// Optional: keep dynamic forcing if you don't want prerender caching of the wrapper.
// You can remove these if static prerender is acceptable.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-6 py-12">
          <p className="text-sm text-slate-300">Preparing password reset…</p>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}