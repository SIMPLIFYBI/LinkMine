import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";

export default function SignupClient() {
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const router = useRouter();

  const handleSignup = async (email, password) => {
    setError("");
    setShowReset(false);
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signUp({ email, password });

    // If error, handle as before
    if (error) {
      if (
        error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("already exists")
      ) {
        setShowReset(true);
      } else {
        setError(error.message);
      }
      return;
    }

    // If user is not confirmed, try sign-in
    if (!data?.user?.confirmed_at) {
      const { error: signInError } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (
        signInError &&
        signInError.message?.toLowerCase().includes("invalid login credentials")
      ) {
        setShowReset(true);
        return;
      }
    }

    // Default message
    setError("");
    setShowReset(false);
    // ...show success message or redirect...
  };

  return (
    <div>
      {/* ...your signup form... */}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {showReset && (
        <div className="mt-4 rounded bg-yellow-100 p-3 text-yellow-900">
          You already have an account.{" "}
          <button
            className="underline text-blue-600"
            onClick={() => router.push("/reset-password")}
          >
            Reset your password
          </button>
        </div>
      )}
    </div>
  );
}