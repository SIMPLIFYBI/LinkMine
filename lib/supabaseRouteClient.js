import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseRouteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase anon env vars");
  const jar = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      get: (name) => jar.get(name)?.value,
      set: (name, value, options) => jar.set({ name, value, ...options }),
      remove: (name, options) => jar.delete({ name, ...options }),
    },
  });
}