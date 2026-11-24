"use client";

import { useState } from "react";
import { LINKEDIN_LIMIT, X_LIMIT, xLength } from "@/lib/intelligence/social";

function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      setDone(false);
    }
  }
  return (
    <button type="button" className="yi-btn" onClick={copy}>
      {done ? "Copied" : label}
    </button>
  );
}

function Field({ id, label, value, onChange, rows, count, limit, hint }) {
  const over = limit != null && count > limit;
  return (
    <div className="yis-field">
      <div className="yis-field__head">
        <label htmlFor={id}>{label}</label>
        <span className={`yi-num yis-count${over ? " is-over" : ""}`}>{limit != null ? `${count} / ${limit}` : count}</span>
      </div>
      <textarea id={id} className="yis-text" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint ? <p className="yis-hint">{hint}</p> : null}
      <div className="yi-actions">
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export default function SocialKit({ slug, title, slides, linkedin, linkedinComment, x, xReply, urls }) {
  const [fmt, setFmt] = useState("square");
  const [liPost, setLiPost] = useState(linkedin);
  const [liComment, setLiComment] = useState(linkedinComment);
  const [xPost, setXPost] = useState(x);
  const [xThread, setXThread] = useState(xReply);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const src = (i) => `/admin/intelligence/social/image/${slug}/${i}?fmt=${fmt}`;
  const name = (i) => `${slug}-${i}-${fmt}.png`;

  function downloadAll() {
    slides.forEach((_, idx) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = src(idx + 1);
        a.download = name(idx + 1);
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, idx * 450);
    });
  }

  async function downloadPdf() {
    setExportingPdf(true);
    setPdfError(false);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.setTitle(title);
      for (let index = 1; index <= slides.length; index++) {
        const response = await fetch(src(index));
        if (!response.ok) throw new Error(`Could not load slide ${index}`);
        const image = await pdf.embedPng(await response.arrayBuffer());
        const { width, height } = image.scale(0.5);
        pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
      }

      const url = URL.createObjectURL(new Blob([await pdf.save()], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-linkedin-${fmt}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setPdfError(true);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="yis">
      <section className="yis-sec" aria-labelledby="yis-img">
        <div className="yis-sec__head">
          <h2 id="yis-img" className="yi-section">Images</h2>
          <div className="yi-seg" role="group" aria-label="Image shape">
            <button type="button" className="yi-btn" aria-pressed={fmt === "square"} onClick={() => setFmt("square")}>Square 1:1</button>
            <button type="button" className="yi-btn" aria-pressed={fmt === "portrait"} onClick={() => setFmt("portrait")}>Portrait 4:5</button>
            <button type="button" className="yi-btn" onClick={downloadAll}>Download PNGs</button>
            <button type="button" className="yi-btn yi-btn--primary" disabled={exportingPdf} onClick={downloadPdf}>
              {exportingPdf ? "Preparing PDF…" : "Download LinkedIn PDF"}
            </button>
          </div>
        </div>
        <p className="yis-hint">
          Post them in this order. Square 1:1 is the default; portrait 4:5 takes more room on LinkedIn.
          The last slide is the call to action.
        </p>
        {pdfError && <p className="yi-flag" role="alert">The PDF couldn’t be created. Try again or reload the social kit if your sign-in has expired.</p>}
        <ol className="yis-slides">
          {slides.map((s, idx) => (
            <li key={`${fmt}-${idx}`} className="yis-slide">
              <img src={src(idx + 1)} alt={s.alt} loading="lazy" className={`yis-img yis-img--${fmt}`} />
              <div className="yis-slide__bar">
                <span className="yi-kicker">Slide {idx + 1} of {slides.length}</span>
                <a className="yi-btn" href={src(idx + 1)} download={name(idx + 1)}>Download</a>
              </div>
              <details className="yis-alt">
                <summary>Alt text</summary>
                <p>{s.alt}</p>
                <CopyButton text={s.alt} label="Copy alt text" />
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section className="yis-sec" aria-labelledby="yis-li">
        <h2 id="yis-li" className="yi-section">LinkedIn</h2>
        <div className="yis-cols">
          <Field id="li-post" label="Post" value={liPost} onChange={setLiPost} rows={18} count={Array.from(liPost).length} limit={LINKEDIN_LIMIT}
            hint="Upload the PDF as a LinkedIn document post. Put the article link in the first comment." />
          <Field id="li-comment" label="First comment" value={liComment} onChange={setLiComment} rows={5} count={Array.from(liComment).length}
            hint="Post this straight after publishing. The image says the link is in the comments." />
        </div>
      </section>

      <section className="yis-sec" aria-labelledby="yis-x">
        <h2 id="yis-x" className="yi-section">X</h2>
        <div className="yis-cols">
          <Field id="x-post" label="Post" value={xPost} onChange={setXPost} rows={10} count={xLength(xPost)} limit={X_LIMIT}
            hint="Attach all four images to this post." />
          <Field id="x-thread" label="Reply with the link" value={xThread} onChange={setXThread} rows={6} count={xLength(xThread)} limit={X_LIMIT}
            hint="Links count as 23 characters on X, however long they are." />
        </div>
      </section>

      <section className="yis-sec" aria-labelledby="yis-links">
        <h2 id="yis-links" className="yi-section">Tracked links</h2>
        <p className="yis-hint">
          Each link carries its own source tag so visits can be told apart. Report: <b>{title}</b>.
        </p>
        <ul className="yis-links">
          <li>
            <span className="yi-kicker">LinkedIn</span>
            <code className="yi-num">{urls.linkedin}</code>
            <CopyButton text={urls.linkedin} />
          </li>
          <li>
            <span className="yi-kicker">X</span>
            <code className="yi-num">{urls.x}</code>
            <CopyButton text={urls.x} />
          </li>
        </ul>
      </section>

      <section className="yis-sec" aria-labelledby="yis-check">
        <h2 id="yis-check" className="yi-section">Before you post</h2>
        <ul className="yis-check">
          <li>Check every number against the report. These posts are copied from it, not generated from the data.</li>
          <li>Open the tracked link and confirm it loads the public report.</li>
          <li>Paste the alt text for every image, on both networks.</li>
          <li>Post the link comment (LinkedIn) or reply (X) straight away, so the call to action is true.</li>
          <li>Keep the source line on the images; the World Bank and BGS attributions depend on it.</li>
        </ul>
      </section>
    </div>
  );
}
