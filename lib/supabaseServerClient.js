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
      get(name) { return cookieStore.get(name)?.value; },
      set(name, value, opts) { try { cookieStore.set({ name, value, ...opts }); } catch {} },
      remove(name, opts) { try { cookieStore.delete({ name, ...opts }); } catch {} },
    },
    // IMPORTANT: pass Authorization through to PostgREST
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.global ? { global: options.global } : {}),
  });
}