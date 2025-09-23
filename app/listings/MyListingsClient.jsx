"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function MyListingsClient() {
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    let mounted = true;

    sb.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user || null);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!user) { setRows(null); return; }
    const sb = supabaseBrowser();
    sb
      .from("listings")
      .select("id,title,status,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("My listings error:", error); setRows([]); return; }
        setRows(data || []);
      });
  }, [user]);

  if (!user) return null;
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Your listings</h2>
        <Link href="/listings/new" className="text-sm text-sky-300 hover:underline">Post a job</Link>
      </div>
      {rows === null ? (
        <div className="mt-3 text-slate-300 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-3 text-slate-300 text-sm">You haven’t posted any listings yet.</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm flex items-center justify-between">
              <span className="truncate">{r.title || "Untitled"}</span>
              <span className="text-xs text-slate-300">{new Date(r.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}