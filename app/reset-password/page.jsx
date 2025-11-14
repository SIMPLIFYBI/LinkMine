import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

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