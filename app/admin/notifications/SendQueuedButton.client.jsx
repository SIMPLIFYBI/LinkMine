"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function SendQueuedButton({ initialQueueLength = 0 }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [queueCount, setQueueCount] = useState(initialQueueLength);
  const router = useRouter();

  async function triggerSend() {
    setStatus("sending");
    setResult(null);
    try {
      const res = await fetch("/api/notifications/jobs/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setResult({ error: json.error || `Failed (${res.status})` });
        return;
      }
      setStatus("done");
      setResult(json);
      // Optimistically adjust queue count
      if (typeof json.sent === "number") {
        setQueueCount(Math.max(0, queueCount - json.sent));
      }
      // Refresh server data (will show true updated count if different)
      startTransition(() => router.refresh());
    } catch (e) {
      setStatus("error");
      setResult({ error: e.message || String(e) });
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={triggerSend}
        disabled={status === "sending" || pending}
        className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-slate-900 hover:bg-sky-500 disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send queued notifications now"}
      </button>

      <div className="text-xs opacity-70">
        Local queued count (optimistic): {queueCount}
      </div>

      {status === "error" && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
          {result?.error || "Unknown error"}
        </div>
      )}
      {status === "done" && result && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 p-2 text-sm text-green-300">
          Sent {result.sent} of {result.total}. Failures:{" "}
          {Array.isArray(result.results)
            ? result.results.filter((r) => r.status !== "sent").length
            : 0}
        </div>
      )}
    </div>
  );
}