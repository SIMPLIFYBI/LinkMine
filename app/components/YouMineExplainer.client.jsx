"use client";

import { Play } from "lucide-react";
import { useState } from "react";

export default function YouMineExplainer() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="watch-youmine" className="scroll-mt-20" aria-labelledby="explainer-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100">A quick introduction</p>
            <h2 id="explainer-title" className="mt-1 text-2xl font-bold text-white">See YouMine in action</h2>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
            {playing ? (
              <video className="absolute inset-0 !block !h-full !max-w-none w-full bg-black object-contain" controls autoPlay playsInline preload="metadata" poster="/YouMine-V2-poster.jpg">
                <source src="/YouMine-V2-web.mp4" type="video/mp4" />
                Your browser does not support this video.
              </video>
            ) : (
              <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950" aria-label="Play the YouMine explainer video">
                <img src="/YouMine-V2-poster.jpg" alt="Preview frame from the YouMine explainer" width="960" height="540" loading="lazy" decoding="async" className="absolute inset-0 h-full !max-w-none w-full object-contain" />
                <span aria-hidden="true" className="absolute inset-0 bg-slate-950/20 transition group-hover:bg-slate-950/5" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-slate-950/70 text-white shadow-lg transition duration-200 group-hover:scale-105 group-hover:bg-cyan-500/90">
                  <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
                </span>
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">The video loads only when you press play.</p>
        </div>

        <aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Text overview</p>
          <h3 className="mt-2 text-lg font-semibold text-white">What YouMine brings together</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">This written overview is a companion to the video, not a word-for-word transcript.</p>
          <ul className="mt-4 space-y-3 text-sm leading-5 text-slate-300">
            <li className="border-l-2 border-sky-300/50 pl-3">Discover specialist expertise and connect directly.</li>
            <li className="border-l-2 border-amber-300/50 pl-3">Find contract and freelance opportunities.</li>
            <li className="border-l-2 border-emerald-300/50 pl-3">Explore training and events from across the industry.</li>
            <li className="border-l-2 border-cyan-300/50 pl-3">Share and discover practical digital tools in the Vault.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}