"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const EMPTY_FORM = {
  displayName: "",
  company: "",
  contactEmail: "",
  headline: "",
  bio: "",
  location: "",
  addResource: false,
  resourceTitle: "",
  resourceSummary: "",
  resourceType: "external",
  resourceFormat: "website",
  sourceName: "",
  sourceUrl: "",
};

export default function CreatorProvisioningPanel({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [publishingId, setPublishingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function request(path, options = {}) {
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    const response = await fetch(path, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error || "Request failed.");
    return body;
  }

  async function loadDrafts() {
    setLoadingDrafts(true);
    try {
      const body = await request("/api/admin/vault-creators");
      setDrafts(Array.isArray(body.creators) ? body.creators : []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load creator drafts.");
    } finally {
      setLoadingDrafts(false);
    }
  }

  useEffect(() => { loadDrafts(); }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await request("/api/admin/vault-creators", {
        method: "POST",
        body: JSON.stringify({
          profile: {
            displayName: form.displayName,
            company: form.company,
            contactEmail: form.contactEmail,
            headline: form.headline,
            bio: form.bio,
            location: form.location,
          },
          resource: form.addResource ? {
            title: form.resourceTitle,
            summary: form.resourceSummary,
            resourceType: form.resourceType,
            resourceFormat: form.resourceFormat,
            sourceName: form.sourceName,
            sourceUrl: form.sourceUrl,
          } : null,
        }),
      });

      const message = "Creator draft created. Populate the profile and resource before publishing and sending the claim invite.";
      setMessage(message);
      toast.success("Creator draft created.");
      setForm(EMPTY_FORM);
      setOpen(false);
      await loadDrafts();
      onCreated?.();
    } catch (requestError) {
      const message = requestError.message || "Unable to create creator profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft(creator) {
    if (!window.confirm(`Publish ${creator.display_name} and send the claim invitation to ${creator.contact_email}?`)) return;
    setPublishingId(creator.id);
    setMessage("");
    setError("");
    try {
      const body = await request("/api/admin/vault-creators", {
        method: "PATCH",
        body: JSON.stringify({ creatorId: creator.id }),
      });
      const message = body.inviteSent
        ? `Published ${creator.display_name} and sent the claim invitation.`
        : `${creator.display_name} is published, but the claim invitation could not be sent: ${body.inviteError || "unknown error"}`;
      setMessage(message);
      if (body.inviteSent) toast.success(`Published ${creator.display_name} and sent the claim invitation.`);
      else toast.error(message);
      await loadDrafts();
      onCreated?.();
    } catch (publishError) {
      const message = publishError.message || "Unable to publish creator.";
      setError(message);
      toast.error(message);
    } finally {
      setPublishingId("");
    }
  }

  return (
    <section className="rounded-lg border border-sky-400/25 bg-sky-500/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Create Vault creator</h2>
          <p className="mt-1 text-sm text-slate-300">Create a private creator draft, populate it, then publish and send the claim invitation when it is ready.</p>
        </div>
        <button type="button" onClick={() => setOpen((current) => !current)} className="rounded border border-sky-300/40 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25">
          {open ? "Close" : "Create creator"}
        </button>
      </div>

      {message ? <p className="mt-3 rounded border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p> : null}
      {error ? <p className="mt-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

      {open ? (
        <form onSubmit={submit} className="mt-5 space-y-5 border-t border-white/10 pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Creator name" value={form.displayName} onChange={(value) => setField("displayName", value)} required />
            <Field label="Creator email" type="email" value={form.contactEmail} onChange={(value) => setField("contactEmail", value)} required />
            <Field label="Company or brand" value={form.company} onChange={(value) => setField("company", value)} />
            <Field label="Location" value={form.location} onChange={(value) => setField("location", value)} />
            <Field label="Headline" value={form.headline} onChange={(value) => setField("headline", value)} />
            <Field label="Bio" value={form.bio} onChange={(value) => setField("bio", value)} multiline />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={form.addResource} onChange={(event) => setField("addResource", event.target.checked)} />
            Add a linked Vault resource now
          </label>

          {form.addResource ? (
            <div className="space-y-4 rounded border border-white/10 bg-slate-950/30 p-4">
              <p className="text-sm text-slate-300">The resource is created as a draft under your admin account and transfers to the creator when they claim their profile.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Resource title" value={form.resourceTitle} onChange={(value) => setField("resourceTitle", value)} required />
                <Field label="Resource summary" value={form.resourceSummary} onChange={(value) => setField("resourceSummary", value)} />
                <Select label="Resource type" value={form.resourceType} onChange={(value) => setField("resourceType", value)} options={[{ value: "external", label: "External link" }, { value: "hosted", label: "Hosted file" }]} />
                <Select label="Format" value={form.resourceFormat} onChange={(value) => setField("resourceFormat", value)} options={[{ value: "website", label: "Website" }, { value: "repository", label: "Repository" }, { value: "app", label: "App" }, { value: "pdf", label: "PDF" }, { value: "excel", label: "Excel" }, { value: "word", label: "Word" }, { value: "powerpoint", label: "PowerPoint" }, { value: "script", label: "Script" }, { value: "generic", label: "Resource" }]} />
                {form.resourceType === "external" ? <Field label="Source URL" type="url" value={form.sourceUrl} onChange={(value) => setField("sourceUrl", value)} required /> : null}
                {form.resourceType === "external" ? <Field label="Source name" value={form.sourceName} onChange={(value) => setField("sourceName", value)} /> : null}
              </div>
            </div>
          ) : null}

          <button type="submit" disabled={saving} className="rounded bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-200 disabled:opacity-50">
            {saving ? "Creating..." : "Create private creator draft"}
          </button>
        </form>
      ) : null}

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-slate-100">Creator drafts awaiting publication</h3>
        <p className="mt-1 text-xs text-slate-400">Complete the profile and its linked resource before sending the creator their claim invitation.</p>
        {loadingDrafts ? <p className="mt-3 text-sm text-slate-400">Loading drafts...</p> : null}
        {!loadingDrafts && !drafts.length ? <p className="mt-3 text-sm text-slate-400">No private creator drafts.</p> : null}
        {!loadingDrafts && drafts.length ? (
          <div className="mt-3 space-y-3">
            {drafts.map((creator) => {
              const resources = creator.resources || [];
              const imageCount = resources.reduce((total, resource) => total + Number(resource.imageCount || 0), 0);
              return (
                <article key={creator.id} className="rounded border border-white/10 bg-slate-950/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-100">{creator.display_name}</h4>
                      <p className="mt-1 text-sm text-slate-400">{creator.contact_email}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Status ready={creator.hasLogo} label="Logo" />
                        <Status ready={resources.length > 0} label={resources.length ? `${resources.length} resource${resources.length === 1 ? "" : "s"}` : "Resource"} />
                        <Status ready={imageCount > 0} label={imageCount ? `${imageCount} preview image${imageCount === 1 ? "" : "s"}` : "Preview image"} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={`/consultants/${creator.id}/edit`} className="rounded border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-white/30">Edit profile</a>
                      {resources.map((resource) => <a key={resource.id} href={`/marketplace/${resource.id}/edit`} className="rounded border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-white/30">Edit {resource.title}</a>)}
                      <button type="button" onClick={() => publishDraft(creator)} disabled={publishingId === creator.id} className="rounded bg-emerald-300 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-200 disabled:opacity-50">
                        {publishingId === creator.id ? "Publishing..." : "Publish and invite"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Status({ ready, label }) {
  return <span className={ready ? "rounded bg-emerald-500/15 px-2 py-1 text-emerald-100" : "rounded bg-amber-500/15 px-2 py-1 text-amber-100"}>{ready ? "Ready: " : "Missing: "}{label}</span>;
}

function Field({ label, value, onChange, type = "text", multiline = false, required = false }) {
  const className = "mt-1 w-full rounded border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-sky-300/50";
  return (
    <label className="block text-xs text-slate-400">
      {label}
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={className} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className={className} />}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-sky-300/50">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}