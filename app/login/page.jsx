import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const viewport = { width: "device-width", initialScale: 1 };

export default function LoginPage() {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
