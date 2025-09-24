import JobsBuilder from "@/app/components/jobs/JobsBuilder";
import JobsTable from "@/app/components/jobs/JobsTable";

export const metadata = { title: "Jobs · LinkMine" };

export default function JobsPage() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Create a job</h1>
      <p className="mt-1 text-sm text-slate-400">Describe the job, choose a service, select consultants, then create.</p>
      <JobsBuilder />
      <JobsTable />
    </main>
  );
}