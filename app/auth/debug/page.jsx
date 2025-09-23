"use client";
import { useState } from "react";

export default function DebugAuthLink() {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");

  const gen = async () => {
    setErr(""); setLink("");
    const res = await fetch("/api/auth/debug-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "signup" })
    });
    const json = await res.json();
    if (!res.ok) setErr(json.error || "Failed");
    else setLink(json.link);
  };

  return (
    <main style={{ padding: 36, fontFamily: "system-ui" }}>
      <h1>Debug: Generate signup confirm link</h1>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"
             style={{ padding:10, border:"1px solid #ddd", borderRadius:6, width:320 }} />
      <button onClick={gen} style={{ marginLeft:8, padding:"8px 12px", border:"1px solid #ddd", borderRadius:6 }}>
        Generate link
      </button>
      {err && <div style={{ color:"crimson", marginTop:12 }}>{err}</div>}
      {link && (
        <div style={{ marginTop:12 }}>
          <a href={link}>Open confirmation link</a>
        </div>
      )}
    </main>
  );
}