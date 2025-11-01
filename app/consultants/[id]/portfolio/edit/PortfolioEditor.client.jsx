"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const emptyImage = { url: "", caption: "", alt: "" };

export default function PortfolioEditor({ consultantId, initialData }) {
  const router = useRouter();
  const sb = supabaseBrowser();

  const [overallIntro, setOverallIntro] = useState(initialData?.overall_intro || "");
  const [images, setImages] = useState(
    Array.isArray(initialData?.images) && initialData.images.length > 0
      ? initialData.images.slice(0, 3)
      : [emptyImage]
  );
  const [attachment, setAttachment] = useState(
    initialData?.attachment || { url: "", name: "", mime: "application/pdf", caption: "" }
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const addImage = () => {
    if (images.length >= 3) return;
    setImages((arr) => [...arr, { ...emptyImage }]);
  };
  const removeImage = (idx) => {
    setImages((arr) => arr.filter((_, i) => i !== idx));
  };
  const updateImage = (idx, patch) => {
    setImages((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    // Enforce caps in UI
    const imgs = (images || []).filter((it) => (it.url || "").trim()).slice(0, 3);
    const payload = {
      consultant_id: consultantId,
      overall_intro: (overallIntro || "").trim() || null,
      images: imgs.map((it) => ({
        url: String(it.url || "").trim(),
        caption: String(it.caption || "").trim(),
        alt: String(it.alt || "").trim(),
      })),
      attachment: attachment?.url
        ? {
          url: String(attachment.url || "").trim(),
          name: String(attachment.name || "").trim(),
          mime: String(attachment.mime || "application/pdf").trim(),
          caption: String(attachment.caption || "").trim(),
        }
        : null,
    };

    const { error } = await sb
      .from("consultant_portfolio")
      .upsert(payload, { onConflict: "consultant_id" });

    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: error.message || "Save failed." });
      return;
    }
    setMsg({ ok: true, text: "Portfolio saved." });
    setTimeout(() => {
      router.replace(`/consultants/${consultantId}/portfolio`);
      router.refresh();
    }, 800);
  }

  return (
    <form onSubmit={onSave} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <div>
        <label className="block text-sm text-slate-300">Intro (optional)</label>
        <textarea
          rows={4}
          maxLength={1200}
          value={overallIntro}
          onChange={(e) => setOverallIntro(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          placeholder="A short introduction to your portfolio or featured projects…"
        />
        <p className="mt-1 text-xs text-slate-400">{overallIntro.length}/1200</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200">Photos (up to 3)</label>
          <button
            type="button"
            onClick={addImage}
            disabled={images.length >= 3}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-100 hover:bg-white/15 disabled:opacity-50"
          >
            Add photo
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-start gap-3">
                <div className="w-28 shrink-0">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.alt || "preview"}
                      className="h-20 w-28 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-28 rounded-lg bg-white/5" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-xs text-slate-300">Image URL (temporary)</label>
                    <input
                      type="url"
                      value={img.url}
                      onChange={(e) => updateImage(idx, { url: e.target.value })}
                      placeholder="https://… (we’ll replace with direct uploads)"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300">Alt text (accessibility)</label>
                    <input
                      type="text"
                      value={img.alt}
                      onChange={(e) => updateImage(idx, { alt: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300">Paragraph about this photo</label>
                    <textarea
                      rows={3}
                      value={img.caption}
                      onChange={(e) => updateImage(idx, { caption: e.target.value })}
                      placeholder="Describe the project, context, and outcome shown in this photo…"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs text-slate-100 hover:bg-white/15"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Tip: keep images under ~1600px wide and ~1–2 MB. Next we’ll add direct uploads with compression.
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-200">Attachment (PDF)</label>
        <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div>
            <label className="block text-xs text-slate-300">PDF URL (temporary)</label>
            <input
              type="url"
              value={attachment.url || ""}
              onChange={(e) => setAttachment((a) => ({ ...a, url: e.target.value }))}
              placeholder="https://… (we’ll replace with direct uploads)"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-300">File name</label>
              <input
                type="text"
                value={attachment.name || ""}
                onChange={(e) => setAttachment((a) => ({ ...a, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300">MIME type</label>
              <input
                type="text"
                value={attachment.mime || "application/pdf"}
                onChange={(e) => setAttachment((a) => ({ ...a, mime: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-300">Paragraph about this document</label>
            <textarea
              rows={3}
              value={attachment.caption || ""}
              onChange={(e) => setAttachment((a) => ({ ...a, caption: e.target.value }))}
              placeholder="Describe what this PDF covers and why it matters…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Keep PDFs under ~5 MB.</p>
      </div>

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

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save portfolio"}
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-300/60 hover:bg-sky-500/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}