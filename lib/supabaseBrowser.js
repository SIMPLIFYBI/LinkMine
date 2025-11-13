import { createBrowserClient } from "@supabase/ssr";

let client;
export function supabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("Missing Supabase config");
    client = createBrowserClient(url, anon);
  }
  return client;
}