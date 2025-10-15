import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServerClient(options = {}) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase configuration.");
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name, options) {
        try {
          cookieStore.delete({ name, ...options });
        } catch {}
      },
    },
    ...(options.global ? { global: options.global } : {}),
  });
}