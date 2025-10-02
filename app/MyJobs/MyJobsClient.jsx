"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function MyJobsClient() {
  const [serviceCategories, setServiceCategories] = useState([]);
  const [servicesStatus, setServicesStatus] = useState("loading");
  const [servicesError, setServicesError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);

  const [consultants, setConsultants] = useState([]);
  const [consultantsStatus, setConsultantsStatus] = useState("idle");
  const [consultantsError, setConsultantsError] = useState("");
  const [selectedConsultantIds, setSelectedConsultantIds] = useState([]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [preferredPaymentType, setPreferredPaymentType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsStatus, setJobsStatus] = useState("idle");
  const [jobsError, setJobsError] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      const session = data?.session;
      if (!session?.access_token || !session?.refresh_token) return;
      fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });
    });
  }, []);

  const loadJobs = useCallback(async (userId) => {
    setJobsStatus("loading");
    setJobsError("");
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from("jobs")
      .select(
        "id, title, location, preferred_payment_type, urgency, created_at, service_id, recipient_ids, contact_name, contact_email"
      )
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setJobsError(error.message);
      setJobs([]);
    } else {
      setJobs(data ?? []);
    }
    setJobsStatus("idle");
  }, []);

  useEffect(() => {
    async function initUser() {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getUser();
      const user = data?.user ?? null;
      setCurrentUser(user);
      if (user?.id) {
        loadJobs(user.id);
      }
    }
    initUser();
  }, [loadJobs]);

  useEffect(() => {
    async function loadServices() {
      setServicesStatus("loading");
      setServicesError("");
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from("service_categories_with_children")
        .select("*")
        .order("position", { ascending: true });

      if (error) {
        setServicesError(error.message);
        setServiceCategories([]);
      } else {
        setServiceCategories(
          (data ?? []).map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            services: Array.isArray(cat.services)
              ? cat.services.map((svc) => ({
                  id: svc.id,
                  name: svc.name,
                  slug: svc.slug,
                  description: svc.description,
                }))
              : [],
          }))
        );
      }
      setServicesStatus("idle");
    }
    loadServices();
  }, []);

  useEffect(() => {
    setSelectedConsultantIds([]);
    if (!selectedServiceId) {
      setConsultants([]);
      setConsultantsStatus("idle");
      setConsultantsError("");
      return;
    }

    async function loadConsultants() {
      setConsultantsStatus("loading");
      setConsultantsError("");
      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from("consultant_services")
        .select(
          `
            consultant:consultants!inner(
              id,
              display_name,
              headline,
              company,
              location,
              contact_email
            )
          `
        )
        .eq("service_id", selectedServiceId);

      if (error) {
        setConsultantsError(error.message);
        setConsultants([]);
      } else {
        const unique = new Map();
        (data ?? []).forEach((row) => {
          if (row.consultant) unique.set(row.consultant.id, row.consultant);
        });
        setConsultants(Array.from(unique.values()));
      }
      setConsultantsStatus("idle");
    }

    loadConsultants();
  }, [selectedServiceId]);

  function toggleConsultant(id) {
    setSelectedConsultantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function createJob(e) {
    e.preventDefault();
    if (!selectedServiceId) {
      setError("Select a service first");
      return;
    }
    if (selectedConsultantIds.length === 0) {
      setError("Select at least one consultant");
      return;
    }

    setStatus("creating");
    setError("");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        job: {
          title,
          description: desc,
          location,
          preferred_payment_type: preferredPaymentType || null,
          urgency: urgency || null,
          service_id: selectedServiceId,
          recipient_ids: selectedConsultantIds,
        },
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || `Failed (${res.status})`);
    } else {
      setTitle("");
      setDesc("");
      setLocation("");
      setPreferredPaymentType("");
      setUrgency("");
      setSelectedServiceId(null);
      setSelectedConsultantIds([]);
      if (currentUser?.id) {
        loadJobs(currentUser.id);
      }
    }
    setStatus("idle");
  }

  const flattenedServices = useMemo(
    () =>
      serviceCategories.flatMap((cat) =>
        cat.services.map((svc) => ({ ...svc, categoryName: cat.name }))
      ),
    [serviceCategories]
  );

  const selectedService = useMemo(
    () => flattenedServices.find((s) => s.id === selectedServiceId) ?? null,
    [flattenedServices, selectedServiceId]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold">My Jobs</h1>

      <section className="space-y-3">
        <h3 className="font-medium">Choose a service</h3>
        {servicesStatus === "loading" && (
          <p className="text-sm opacity-70">Loading services…</p>
        )}
        {servicesError && (
          <p className="text-sm text-red-400">Error: {servicesError}</p>
        )}
        {!servicesError && servicesStatus === "idle" && (
          <button
            type="button"
            onClick={() => setServicePickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-left transition hover:border-blue-300/60 hover:bg-blue-500/10"
          >
            <span className="font-medium">
              {selectedService ? selectedService.name : "Select service"}
            </span>
            {selectedService && (
              <span className="text-xs opacity-70">
                {selectedService.categoryName}
              </span>
            )}
          </button>
        )}
      </section>

      {servicePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 ring-1 ring-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-lg font-semibold">Select a service</h2>
              <button
                type="button"
                onClick={() => setServicePickerOpen(false)}
                className="rounded-md px-3 py-1 text-sm hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto px-4 py-4 md:grid-cols-2 lg:grid-cols-3">
              {serviceCategories.map((cat) => (
                <div key={cat.id} className="min-w-0">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                    {cat.name}
                  </div>
                  <ul className="space-y-1.5">
                    {cat.services.map((svc) => {
                      const active = svc.id === selectedServiceId;
                      return (
                        <li key={svc.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedServiceId(svc.id);
                              setServicePickerOpen(false);
                            }}
                            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                              active
                                ? "border border-blue-400 bg-blue-500/20 text-white"
                                : "border border-transparent bg-white/5 text-slate-200 hover:border-blue-300/60 hover:bg-blue-500/10"
                            }`}
                          >
                            <div className="font-medium">{svc.name}</div>
                            {svc.description && (
                              <div className="text-xs opacity-70">
                                {svc.description}
                              </div>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {serviceCategories.length === 0 && (
                <p className="text-sm opacity-70">No services available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-medium">
          Consultants offering{" "}
          {selectedService ? `"${selectedService.name}"` : "(select a service)"}
        </h3>
        {!selectedService && (
          <p className="text-sm opacity-70">
            Choose a service above to view consultants.
          </p>
        )}
        {selectedService && consultantsStatus === "loading" && (
          <p className="text-sm opacity-70">Loading consultants…</p>
        )}
        {selectedService && consultantsError && (
          <p className="text-sm text-red-400">Error: {consultantsError}</p>
        )}
        {selectedService &&
          !consultantsError &&
          consultantsStatus === "idle" && (
            <div className="space-y-2">
              <p className="text-sm opacity-80">
                Selected {selectedConsultantIds.length} consultant
                {selectedConsultantIds.length === 1 ? "" : "s"}.
              </p>
              <ul className="space-y-2">
                {consultants.map((consultant) => {
                  const checked = selectedConsultantIds.includes(consultant.id);
                  return (
                    <li
                      key={consultant.id}
                      className={`flex items-start gap-3 rounded border p-3 ${
                        checked
                          ? "border-blue-400 bg-blue-500/20"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={checked}
                        onChange={() => toggleConsultant(consultant.id)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold">
                            {consultant.display_name || "Unnamed consultant"}
                          </span>
                          {consultant.contact_email && (
                            <span className="text-xs opacity-70">
                              {consultant.contact_email}
                            </span>
                          )}
                        </div>
                        {consultant.headline && (
                          <div className="text-sm opacity-80">
                            {consultant.headline}
                          </div>
                        )}
                        {(consultant.company || consultant.location) && (
                          <div className="text-xs opacity-60">
                            {[consultant.company, consultant.location]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                {consultants.length === 0 && (
                  <li className="text-sm opacity-70">
                    No consultants currently linked to this service.
                  </li>
                )}
              </ul>
            </div>
          )}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Create a job</h3>
        <form onSubmit={createJob} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Title</span>
            <input
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Location</span>
            <input
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kalgoorlie, WA"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Preferred payment type</span>
            <select
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              value={preferredPaymentType}
              onChange={(e) => setPreferredPaymentType(e.target.value)}
            >
              <option value="">Select an option</option>
              <option value="Ongoing Hourly">Ongoing Hourly</option>
              <option value="Fixed-Term Hourly">Fixed-Term Hourly</option>
              <option value="Fixed Price">Fixed Price</option>
              <option value="Cost Plus">Cost Plus</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Urgency</span>
            <select
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="">Select urgency</option>
              <option value="Immediately">Immediately</option>
              <option value="Within Weeks">Within Weeks</option>
              <option value="Within Months">Within Months</option>
              <option value="Exploring Options">Exploring Options</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Description</span>
            <textarea
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              required
            />
          </label>
          <button
            type="submit"
            disabled={status !== "idle"}
            className="rounded bg-green-600 px-3 py-2 font-medium hover:bg-green-500"
          >
            {status === "creating" ? "Creating..." : "Post job"}
          </button>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Jobs you’ve requested</h3>
        {!currentUser && (
          <p className="text-sm opacity-70">
            Sign in to view the jobs you’ve requested.
          </p>
        )}
        {currentUser && jobsStatus === "loading" && (
          <p className="text-sm opacity-70">Loading your jobs…</p>
        )}
        {currentUser && jobsError && (
          <p className="text-sm text-red-400">Error: {jobsError}</p>
        )}
        {currentUser && jobsStatus === "idle" && !jobsError && (
          <>
            {jobs.length === 0 ? (
              <p className="text-sm opacity-70">
                You haven’t requested any quotes yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead>
                    <tr className="bg-white/5 text-left">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Urgency</th>
                      <th className="px-4 py-3 font-medium">Consultants</th>
                      <th className="px-4 py-3 font-medium">Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-white/5">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {job.title}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {job.location || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {job.preferred_payment_type || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {job.urgency || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {Array.isArray(job.recipient_ids)
                            ? job.recipient_ids.length
                            : 0}
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {job.created_at
                            ? new Date(job.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}