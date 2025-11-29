import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TrainingSchedulePage() {
  const enabled =
    String(process.env.TRAINING_SCHEDULE_ENABLED || "").toLowerCase() === "true";

  if (!enabled) {
    console.log("[training] flag:", process.env.TRAINING_SCHEDULE_ENABLED);
    return notFound();
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = process.env.SITE_URL || `${proto}://${host}`;

  const res = await fetch(`${base}/api/training/sessions`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { sessions: [] };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold text-white">Training Schedule (Beta)</h1>
        <p className="mt-2 text-sm text-slate-400">Centralised view of provider sessions.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.sessions.map((s) => (
          <div key={s.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-white font-medium">{s.course}</div>
            <div className="text-slate-400 text-sm">{s.provider} • {s.location}</div>
            <div className="text-slate-400 text-sm">
              {new Date(s.starts_at).toLocaleString()} — {new Date(s.ends_at).toLocaleString()}
            </div>
          </div>
        ))}

        {data.sessions.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-slate-400">
            No sessions yet.
          </div>
        )}
      </div>
    </main>
  );
}