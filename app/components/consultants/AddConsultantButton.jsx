"use client";

import Link from "next/link";

export default function AddConsultantButton({ className = "" }) {
  return (
    <Link
      href="/consultants/new"
      prefetch={false}
      className={`rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-sky-600 ${className}`}
      aria-label="Add consultant (go to profile setup)"
    >
      Add Your Profile
    </Link>
  );
}

// In the form fields, mark the three as required:
// <Field id={ids.headline} label="Headline" value={headline} onChange={setHeadline} placeholder="Short summary..." required />
// <Field id={ids.location} label="Location" value={location} onChange={setLocation} placeholder="City, Country" required />
// <Field id={ids.contactEmail} label="Contact email" type="email" value={contactEmail} onChange={setContactEmail} placeholder="name@example.com" required />