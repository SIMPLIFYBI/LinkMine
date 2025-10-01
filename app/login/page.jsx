import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const viewport = { width: "device-width", initialScale: 1 };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
