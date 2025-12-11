"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const initial = {
  display_name: "",
  headline: "",
  bio: "",
  company: "",
  location: "",
  contact_email: "",
  phone: "",
  linkedin_url: "",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  abn: "",
  acn: "",
  is_trainer: false,
  provider_kind: "both",
  visibility: "private",
  status: "pending",
};

export default function InProgressClient() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // new

  useEffect(() => {
    const init = async () => {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      setUser(data?.session?.user ?? null);
      await loadList();
    };
    init();
  }, []);

  useEffect(() => {
    // reload when filter changes
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibilityFilter]);

  async function loadList() {
    setLoading(true);
    setError("");
    try {
      const sb = supabaseBrowser();
      let q = sb
        .from("consultants")
        .select(
          "id, display_name, company, location, contact_email, visibility, status, created_at, reviewed_at, is_trainer, provider_kind, view_count, invite_email" // added invite_email
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (visibilityFilter !== "all") {
        q = q.eq("visibility", visibilityFilter);
      }

      const { data, error: err } = await q;
      if (err) throw new Error(err.message);
      setItems(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function startCreate() {
    setEditing(null);
    setForm(initial);
    setFormOpen(true);
    setMessage("");
    setError("");
  }
  function startEdit(item) {
    setEditing(item);
    setForm({
      ...initial,
      ...item,
      provider_kind: item.provider_kind || "both",
      visibility: item.visibility || "private",
      status: item.status || "pending",
    });
    setFormOpen(true);
    setMessage("");
    setError("");
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(initial);
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const sb = supabaseBrowser();
      const payload = {
        ...form,
        status: form.status || "pending",
        visibility: form.visibility || "private",
        user_id: form.user_id ?? null,
      };

      let res;
      if (editing?.id) {
        res = await sb.from("consultants").update(payload).eq("id", editing.id).select().single();
      } else {
        res = await sb.from("consultants").insert([payload]).select().single();
      }
      if (res.error) throw new Error(res.error.message);

      setMessage(editing?.id ? "Consultant updated." : "Draft created.");
      await loadList();
      setEditing(res.data);
      // keep form open for further edits; optionally close:
      // closeForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(item) {
    try {
      const sb = supabaseBrowser();
      const next = item.visibility === "public" ? "private" : "public";
      const { error: err } = await sb
        .from("consultants")
        .update({ visibility: next })
        .eq("id", item.id);
      if (err) throw new Error(err.message);
      await loadList();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleInviteEmail(item) {
    try {
      const sb = supabaseBrowser();
      const next = !item.invite_email;
      const { error: err } = await sb
        .from("consultants")
        .update({ invite_email: next })
        .eq("id", item.id);
      if (err) throw new Error(err.message);
      await loadList();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 py-12">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-white">In Progress</h1>
          <p className="text-sm text-slate-400">
            Manage consultant drafts. Set visibility to public only when ready.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-300">
            Visibility
            <select
              className="ml-2 rounded border border-white/10 bg-slate-900/50 px-2 py-1 text-xs text-white"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <button
            type="button"
            onClick={startCreate}
            className="rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Create new draft
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {!user && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Sign in required to manage consultants.
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">All consultants</h2>
        <div className="overflow-x-auto rounded border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-800/40 text-slate-300">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Trainer</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Visibility</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Invite Email</th>
                {/* new column header */}
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-3 py-4 text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-4 text-slate-400">
                    No consultants found.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-white">{it.display_name || "-"}</td>
                    <td className="px-3 py-2 text-slate-200">{it.company || "-"}</td>
                    <td className="px-3 py-2 text-slate-200">{it.location || "-"}</td>
                    <td className="px-3 py-2">{it.is_trainer ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{it.provider_kind || "both"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          it.visibility === "public"
                            ? "rounded bg-emerald-500/20 px-2 py-1 text-emerald-200"
                            : "rounded bg-slate-600/30 px-2 py-1 text-slate-200"
                        }
                      >
                        {it.visibility || "private"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          it.status === "approved"
                            ? "rounded bg-emerald-500/20 px-2 py-1 text-emerald-200"
                            : it.status === "rejected"
                            ? "rounded bg-red-500/20 px-2 py-1 text-red-200"
                            : "rounded bg-amber-500/20 px-2 py-1 text-amber-200"
                        }
                      >
                        {it.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          checked={!!it.invite_email}
                          onChange={() => toggleInviteEmail(it)}
                        />
                        Sent
                      </label>
                    </td>
                    <td className="px-3 py-2">{it.view_count ?? 0}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(it.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                          onClick={() => startEdit(it)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                          onClick={() => toggleVisibility(it)}
                        >
                          {it.visibility === "public" ? "Make private" : "Make public"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <section className="space-y-6 rounded-lg border border-white/10 bg-slate-800/30 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              {editing?.id ? "Edit consultant" : "Create draft"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="rounded bg-slate-700/50 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Text label="Display name" value={form.display_name} onChange={(v) => setField("display_name", v)} />
            <Text label="Headline" value={form.headline} onChange={(v) => setField("headline", v)} />
            <TextArea label="Bio" value={form.bio} onChange={(v) => setField("bio", v)} />
            <Text label="Company" value={form.company} onChange={(v) => setField("company", v)} />
            <Text label="Location" value={form.location} onChange={(v) => setField("location", v)} />
            <Text label="Contact email" type="email" value={form.contact_email} onChange={(v) => setField("contact_email", v)} />
            <Text label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Text label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => setField("linkedin_url", v)} />
            <Text label="Facebook URL" value={form.facebook_url} onChange={(v) => setField("facebook_url", v)} />
            <Text label="Twitter/X URL" value={form.twitter_url} onChange={(v) => setField("twitter_url", v)} />
            <Text label="Instagram URL" value={form.instagram_url} onChange={(v) => setField("instagram_url", v)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Text label="ABN" value={form.abn} onChange={(v) => setField("abn", v)} />
            <Text label="ACN" value={form.acn} onChange={(v) => setField("acn", v)} />
            <Checkbox label="Is trainer" checked={form.is_trainer} onChange={(v) => setField("is_trainer", v)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Provider kind"
              value={form.provider_kind}
              onChange={(v) => setField("provider_kind", v)}
              options={[
                { value: "both", label: "Both" },
                { value: "training", label: "Training" },
                { value: "consulting", label: "Consulting" },
              ]}
            />
            <Select
              label="Visibility"
              value={form.visibility}
              onChange={(v) => setField("visibility", v)}
              options={[
                { value: "private", label: "Private (hidden)" },
                { value: "public", label: "Public (visible)" },
              ]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => setField("status", v)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing?.id ? "Save changes" : "Create draft"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initial);
                setMessage("");
                setError("");
              }}
              className="rounded bg-slate-700/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              Reset
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Text({ label, value, onChange, type = "text" }) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
      />
    </label>
  );
}
function TextArea({ label, value, onChange }) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
      />
    </label>
  );
}
function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}