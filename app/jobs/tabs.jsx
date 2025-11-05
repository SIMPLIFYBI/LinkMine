"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import JobsBoardSection from "@/app/jobs/JobsBoardSection";
import MyJobsClient from "./MyJobsClient"; // Create job tab

const tabs = [
  { key: "board", label: "Jobs board" },
  { key: "my-jobs", label: "Create job" },
];

export default function JobsPageTabs({
  initialTab = "board",
  boardJobs = [],
  boardPage = 1,
  boardHasPrev = false,
  boardHasNext = false,
}) {
  const [active, setActive] = useState(initialTab);

  const ActiveContent = useMemo(() => {
    switch (active) {
      case "my-jobs":
        return <MyJobsClient />;
      case "board":
      default:
        return <JobsBoardSection jobs={boardJobs} />;
    }
  }, [active, boardJobs]);

  const buildPageHref = (targetPage) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set("page", String(targetPage));
    // Default tab (board) by not including ?tab=...
    const q = params.toString();
    return `/jobs${q ? `?${q}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="flex gap-3 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-100">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${
                isActive ? "bg-sky-500 text-slate-900 shadow" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section className="mt-6">{ActiveContent}</section>

      {active === "board" && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={boardHasPrev ? buildPageHref(boardPage - 1) : "#"}
            aria-disabled={!boardHasPrev}
            className={`rounded-md border border-white/10 px-3 py-1.5 text-sm ${
              boardHasPrev ? "text-slate-200 hover:bg-white/10" : "text-slate-500 cursor-not-allowed"
            }`}
            prefetch
          >
            Prev
          </Link>
          <span className="text-xs text-slate-400">Page {boardPage}</span>
          <Link
            href={boardHasNext ? buildPageHref(boardPage + 1) : "#"}
            aria-disabled={!boardHasNext}
            className={`rounded-md border border-white/10 px-3 py-1.5 text-sm ${
              boardHasNext ? "text-slate-200 hover:bg-white/10" : "text-slate-500 cursor-not-allowed"
            }`}
            prefetch
          >
            Next
          </Link>
        </div>
      )}
    </main>
  );
}