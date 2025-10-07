"use client";

import { useState, useMemo } from "react";
import JobsBoardSection from "@/app/jobs/JobsBoardSection";
import JobsTableSection from "@/app/jobs/JobsTableSection";
import JobsRequestedTable from "@/app/jobs/JobsRequestedTable";
import MyJobsClient from "@/app/MyJobs/MyJobsClient";

const tabs = [
  { key: "board", label: "Jobs board" },
  { key: "table", label: "Jobs table" },
  { key: "my-jobs", label: "My jobs" },
];

export default function JobsPageTabs({ initialTab = "board", boardJobs = [] }) {
  const [active, setActive] = useState(initialTab);

  const ActiveContent = useMemo(() => {
    switch (active) {
      case "my-jobs":
        return <MyJobsClient />;
      case "table":
        return <JobsRequestedTable />;
      case "board":
      default:
        return <JobsBoardSection jobs={boardJobs} />;
    }
  }, [active, boardJobs]);

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
                isActive
                  ? "bg-sky-500 text-slate-900 shadow"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <section className="mt-6">{ActiveContent}</section>
    </main>
  );
}