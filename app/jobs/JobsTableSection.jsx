"use client";

export default function JobsTableSection({ jobs }) {
  if (!jobs?.length) {
    return (
      <p className="text-center text-sm text-slate-300">
        No public jobs available right now. Check back soon.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-lg ring-1 ring-white/5">
      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
        <thead className="bg-white/10 text-xs uppercase tracking-wide text-slate-300">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Company</th>
            <th className="px-4 py-3 text-left">Service</th>
            <th className="px-4 py-3 text-left">Location</th>
            <th className="px-4 py-3 text-left">Payment</th>
            <th className="px-4 py-3 text-left">Urgency</th>
            <th className="px-4 py-3 text-left">Listed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-white/10">
              <td className="px-4 py-3 font-semibold text-slate-50">
                {job.title}
              </td>
              <td className="px-4 py-3">{job.company || "—"}</td>
              <td className="px-4 py-3">
                {job.service?.name || "General"}
              </td>
              <td className="px-4 py-3">{job.location || "—"}</td>
              <td className="px-4 py-3">
                {job.preferred_payment_type || "—"}
              </td>
              <td className="px-4 py-3">{job.urgency || "—"}</td>
              <td className="px-4 py-3">
                {job.created_at
                  ? new Date(job.created_at).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}