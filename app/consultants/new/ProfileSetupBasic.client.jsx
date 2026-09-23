"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Check, Layers3, PackageOpen, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { COUNTRY_OPTIONS, GLOBAL_REGION_OPTIONS } from "@/lib/geoOptions";

const MAX_HEADLINE = 120;
const MAX_SERVICES = 15; // safety cap
const PROFILE_TYPES = [
  {
    value: "consultant",
    label: "Consultant / Service Provider",
    description: "Offer field or professional services and appear in consultant search.",
  },
  {
    value: "creator",
    label: "Digital product creator",
    description: "Publish and manage digital resources in Vault.",
  },
  {
    value: "both",
    label: "Both",
    description: "Run consulting services and publish digital resources.",
  },
];

function marketLabel(value) {
  return value === "oil_gas" ? "Oil & Gas" : "Mining";
}

const PROFILE_FIELD_HELP = {
  generic: {
    displayName: "This is the public profile name people will see in listings and on your profile page.",
    headline: "A one-line summary that helps people quickly understand what you offer.",
    city: "Your primary base city so clients can understand local context and timezone.",
    contactEmail: "Public enquiries go here. Use an inbox you actively monitor.",
  },
  consultant: {
    displayName: "Use your personal or business trading name that clients would recognize.",
    headline: "Summarize your consulting specialty and outcomes in one line.",
    city: "Your primary service location or operating base.",
    contactEmail: "Client enquiry email for consulting opportunities.",
  },
  creator: {
    displayName: "Use your creator or brand name that should appear on your digital products.",
    headline: "Describe the kind of digital products you create and who they help.",
    city: "Your base location for credibility and timezone context.",
    contactEmail: "Customer and collaboration enquiries for your digital products.",
  },
  both: {
    displayName: "Use the name that best represents both your consulting and digital product brand.",
    headline: "Blend your service capability and digital product focus in one clear line.",
    city: "Your main operating location and timezone.",
    contactEmail: "Primary inbox for consulting and product enquiries.",
  },
};

const PROFILE_TYPE_ICONS = {
  consultant: BriefcaseBusiness,
  creator: PackageOpen,
  both: Layers3,
};

export default function ProfileSetupBasic({ services = [], initialProfileType = "" }) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [globalRegion, setGlobalRegion] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [profileType, setProfileType] = useState(initialProfileType || "");

  // Services state
  const [selected, setSelected] = useState(new Set()); // service ids
  const [servicesOpen, setServicesOpen] = useState(false);
  const [activeMarket, setActiveMarket] = useState("mining");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const requiresServices = profileType === "consultant" || profileType === "both";

  const groupedByMarket = useMemo(() => {
    const byMarket = new Map();
    for (const s of services) {
      const market = s?.market === "oil_gas" ? "oil_gas" : "mining";
      const cat = s?.category?.name || "Other";
      if (!byMarket.has(market)) byMarket.set(market, new Map());
      const byCat = byMarket.get(market);
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(s);
    }
    return {
      mining: Array.from(byMarket.get("mining")?.entries() || [])
        .map(([category, list]) => [category, [...list].sort((a, b) => a.name.localeCompare(b.name))])
        .sort((a, b) => a[0].localeCompare(b[0])),
      oil_gas: Array.from(byMarket.get("oil_gas")?.entries() || [])
        .map(([category, list]) => [category, [...list].sort((a, b) => a.name.localeCompare(b.name))])
        .sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [services]);

  const selectedByMarket = useMemo(() => {
    const lookup = new Map(services.map((service) => [service.id, service.market === "oil_gas" ? "oil_gas" : "mining"]));
    let mining = 0;
    let oil_gas = 0;
    for (const id of selected) {
      if (lookup.get(id) === "oil_gas") oil_gas += 1;
      else mining += 1;
    }
    return { mining, oil_gas };
  }, [selected, services]);

  const fieldHelp = PROFILE_FIELD_HELP[profileType] || PROFILE_FIELD_HELP.generic;

  function toggleService(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= MAX_SERVICES) return prev; // ignore beyond cap
        next.add(id);
      }
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    const name = displayName.trim();
    const head = headline.trim();
    const loc = location.trim();
    const email = contactEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!profileType) return setMsg({ ok: false, text: "Choose a profile type to continue." });
    if (!name) return setMsg({ ok: false, text: "Display name is required." });
    if (!head) return setMsg({ ok: false, text: "Headline is required." });
    if (head.length > MAX_HEADLINE) return setMsg({ ok: false, text: `Headline must be ${MAX_HEADLINE} characters or fewer.` });
    if (!loc) return setMsg({ ok: false, text: "City is required." });
    if (!countryCode) return setMsg({ ok: false, text: "Country is required." });
    if (!globalRegion) return setMsg({ ok: false, text: "Global region is required." });
    if (!email) return setMsg({ ok: false, text: "Contact email is required." });
    if (!emailOk) return setMsg({ ok: false, text: "Enter a valid email address." });
    if (requiresServices && selected.size < 1) return setMsg({ ok: false, text: "Select at least one service you offer." });

    setSaving(true);
    setMsg(null);

    let authHeader = {};
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    } catch {}

    try {
      const res = await fetch("/api/consultants/create-draft", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader },
        body: JSON.stringify({
          profile_type: profileType,
          display_name: name,
          headline: head,
          location: loc,
          country_code: countryCode,
          global_region: globalRegion,
          contact_email: email,
          services: Array.from(selected),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Create failed");
      const id = data?.id;
      if (!id) throw new Error("Missing new consultant id");
      router.replace(`/consultants/${id}/edit`);
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err.message || "Create failed." });
      setSaving(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">1</span>
                Choose your profile type <span className="text-rose-300">*</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">This determines how your profile works across YouMine.</p>
            </div>
            {profileType ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-100"><Check className="h-3.5 w-3.5" /> Selected</span> : null}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {PROFILE_TYPES.map((option) => {
              const active = option.value === profileType;
              const Icon = PROFILE_TYPE_ICONS[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProfileType(option.value)}
                  className={[
                    "group relative min-h-[142px] overflow-hidden rounded-2xl border p-4 text-left transition duration-200",
                    active
                      ? "border-cyan-200/65 bg-[linear-gradient(145deg,rgba(34,211,238,0.2),rgba(14,116,144,0.11))] text-white shadow-[0_18px_36px_-26px_rgba(34,211,238,0.95)] ring-1 ring-cyan-200/25"
                      : "border-white/10 bg-slate-950/35 text-slate-200 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-white/[0.07]",
                  ].join(" ")}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${active ? "border-cyan-100/40 bg-cyan-100/15 text-cyan-100" : "border-white/10 bg-white/[0.05] text-slate-300 group-hover:text-cyan-100"}`}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <div className="mt-4 text-sm font-bold">{option.label}</div>
                  <div className="mt-1.5 text-xs leading-5 text-slate-300">{option.description}</div>
                  {active ? <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-200 text-slate-950"><Check className="h-3.5 w-3.5 stroke-[3]" /></span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">2</span>
            Add your essentials
          </div>
          <p className="mt-1 text-xs text-slate-400">These details appear on your public profile and help the right people find you.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            required
            placeholder={
              profileType === "creator"
                ? "e.g. MineFlow Studio"
                : profileType === "both"
                ? "e.g. Jane Doe | MineFlow Studio"
                : "e.g. Jane Doe"
            }
            infoText={fieldHelp.displayName}
          />
          <Field
            label={`Headline (max ${MAX_HEADLINE})`}
            value={headline}
            onChange={(v) => setHeadline(v.slice(0, MAX_HEADLINE))}
            required
            placeholder={
              profileType === "creator"
                ? "e.g. Build drill-and-blast templates for open pit teams"
                : profileType === "both"
                ? "e.g. Mine planning consultant + digital workflow creator"
                : "Short summary, e.g. Mining engineer (LOM planning)"
            }
            hint={`${headline.length}/${MAX_HEADLINE}`}
            infoText={fieldHelp.headline}
          />
          <Field
            label="City"
            value={location}
            onChange={setLocation}
            required
            placeholder="e.g. Perth"
            infoText={fieldHelp.city}
          />
          <SelectField
            label="Country"
            value={countryCode}
            onChange={setCountryCode}
            required
            options={COUNTRY_OPTIONS}
            placeholder="Select a country"
          />
          <SelectField
            label="Global region"
            value={globalRegion}
            onChange={setGlobalRegion}
            required
            options={GLOBAL_REGION_OPTIONS}
            placeholder="Select a region"
          />
          <Field
            label="Contact email"
            type="email"
            value={contactEmail}
            onChange={setContactEmail}
            required
            placeholder="name@example.com"
            infoText={fieldHelp.contactEmail}
          />
          </div>
        </div>

        {profileType ? (
          <p className="-mt-1 text-xs text-slate-400">
            Hints are tailored to your selected profile type: {PROFILE_TYPES.find((p) => p.value === profileType)?.label || "Profile"}.
          </p>
        ) : null}

        {requiresServices ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">3</span>
                Services you offer <span className="text-rose-300">*</span>
              </p>
              <span className="text-xs text-slate-400">
                {selectedCount > 0 ? `${selectedCount} selected` : "None selected"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Choose the expertise you want clients to discover.</p>
            <button
              type="button"
              onClick={() => setServicesOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/20"
              aria-haspopup="dialog"
              aria-expanded={servicesOpen}
            >
              {selectedCount > 0 ? "Edit services" : "Add services"}
            </button>
            <p className="text-xs text-slate-400">
              Pick at least one. You can add mining services, Oil & Gas services, or both.
            </p>
            {selectedCount > 0 ? (
              <p className="text-xs text-slate-500">
                {selectedByMarket.mining > 0 ? `${selectedByMarket.mining} Mining` : null}
                {selectedByMarket.mining > 0 && selectedByMarket.oil_gas > 0 ? " • " : null}
                {selectedByMarket.oil_gas > 0 ? `${selectedByMarket.oil_gas} Oil & Gas` : null}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
            Services are optional for creator profiles and can be added later if you switch to consultant or both.
          </div>
        )}

        {msg && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.ok
                ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border border-rose-400/40 bg-rose-500/10 text-rose-100"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-100/35 bg-[linear-gradient(135deg,#22d3ee,#0284c7_55%,#1d4ed8)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_16px_34px_-18px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {saving ? "Creating…" : "Create and continue"}
          </button>
          <span className="text-xs text-slate-400">Your profile remains private until you submit it for review.</span>
        </div>
      </form>

      {/* Services picker overlay */}
      {requiresServices && servicesOpen && (
        <ServicesPicker
          activeMarket={activeMarket}
          groupedByMarket={groupedByMarket}
          selected={selected}
          onToggle={toggleService}
          onClose={() => setServicesOpen(false)}
          onMarketChange={setActiveMarket}
          maxSelect={MAX_SERVICES}
        />
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder, hint, infoText }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="flex items-center gap-2">
        <span>
          {label} {required ? "*" : ""}
        </span>
        {infoText ? (
          <span className="group relative inline-flex">
            <button
              type="button"
              aria-label={`About ${label}`}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-[11px] font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              i
            </button>
            <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-slate-100 shadow-xl group-hover:block group-focus-within:block">
              {infoText}
            </span>
          </span>
        ) : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
      />
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, required = false, options, placeholder }) {
  return (
    <label className="block text-sm text-slate-300">
      {label} {required ? "*" : ""}
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full appearance-none rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 pr-10 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
        >
          <option value="" className="bg-slate-900 text-slate-200">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5.5 7.5 4.5 5 4.5-5" />
        </svg>
      </div>
    </label>
  );
}

function ServicesPicker({ groupedByMarket, activeMarket, selected, onToggle, onClose, onMarketChange, maxSelect }) {
  const [q, setQ] = useState("");
  const grouped = groupedByMarket?.[activeMarket] || [];

  function isMatch(name) {
    if (!q.trim()) return true;
    return name.toLowerCase().includes(q.toLowerCase());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Select services"
    >
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[0_40px_80px_rgba(8,12,24,0.55)] backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Select services</h3>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="mt-4 inline-flex rounded-full border border-white/15 bg-slate-950/60 p-1">
          {["mining", "oil_gas"].map((market) => {
            const active = market === activeMarket;
            return (
              <button
                key={market}
                type="button"
                onClick={() => onMarketChange(market)}
                className={[
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  active
                    ? market === "oil_gas"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-sky-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {marketLabel(market)}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {selected.size} selected
            </span>
          </div>

          <div className="max-h-[60vh] overflow-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            {grouped.length === 0 ? (
              <p className="text-sm text-slate-400">No services available.</p>
            ) : (
              grouped.map(([cat, list]) => {
                const filtered = list.filter((s) => isMatch(s.name));
                if (!filtered.length) return null;
                return (
                  <div key={cat} className="mb-4 last:mb-0">
                    <div className="text-xs font-semibold text-slate-300">{cat}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filtered.map((s) => {
                        const checked = selected.has(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                              checked
                                ? "border-sky-400/60 bg-sky-500/20 text-sky-100"
                                : "border-white/15 bg-white/10 text-slate-200 hover:bg-white/15"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-sky-400"
                              checked={checked}
                              onChange={() => onToggle(s.id)}
                            />
                            <span>{s.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">
              Select at least one. Max {maxSelect}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}