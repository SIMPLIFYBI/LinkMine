"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export async function authedFetch(input, init = {}) {
  const sb = supabaseBrowser();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;

  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers, credentials: 'include' });
}

async function createJob(job) {
  const res = await authedFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({ job }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Failed (${res.status})`);
  return body;
}