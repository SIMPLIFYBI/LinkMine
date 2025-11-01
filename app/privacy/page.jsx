export const metadata = {
  title: "Privacy Policy · YouMine",
  description:
    "Learn how YouMine collects, uses, and protects your data. Read about what we collect, why, legal bases, cookies, analytics, retention, and your privacy rights.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · YouMine",
    description:
      "Learn how YouMine collects, uses, and protects your data. Read about what we collect, why, legal bases, cookies, analytics, retention, and your privacy rights.",
    url: "/privacy",
    type: "website",
  },
};

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10">
        <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">{children}</div>
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Optional JSON‑LD for Organization
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "YouMine",
    url: "https://youmine.com.au",
    email: "info@youmine.com.au",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "info@youmine.com.au",
        availableLanguage: ["English"],
      },
    ],
    termsOfService: "https://youmine.com.au/terms",
    privacyPolicy: "https://youmine.com.au/privacy",
  };

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-10">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* JSON‑LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Privacy
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-300">Last updated: {lastUpdated}</p>
        <p className="mt-3 text-slate-300">
          Your privacy matters. This policy explains what personal data we collect, how we use it, the
          choices you have, and your rights. It applies to the YouMine website, apps, and related services.
        </p>
      </header>

      {/* Table of contents */}
      <nav
        aria-label="Table of contents"
        className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10"
      >
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          <li><a className="text-sky-300 hover:underline" href="#who">Who we are</a></li>
          <li><a className="text-sky-300 hover:underline" href="#scope">Scope</a></li>
          <li><a className="text-sky-300 hover:underline" href="#data-we-collect">Data we collect</a></li>
          <li><a className="text-sky-300 hover:underline" href="#how-we-use">How we use data</a></li>
          <li><a className="text-sky-300 hover:underline" href="#legal-bases">Legal bases (GDPR)</a></li>
          <li><a className="text-sky-300 hover:underline" href="#cookies">Cookies & tracking</a></li>
          <li><a className="text-sky-300 hover:underline" href="#analytics">Analytics & email</a></li>
          <li><a className="text-sky-300 hover:underline" href="#sharing">Sharing with third parties</a></li>
          <li><a className="text-sky-300 hover:underline" href="#retention">Data retention</a></li>
          <li><a className="text-sky-300 hover:underline" href="#security">Security</a></li>
          <li><a className="text-sky-300 hover:underline" href="#rights">Your rights</a></li>
          <li><a className="text-sky-300 hover:underline" href="#kids">Children’s privacy</a></li>
          <li><a className="text-sky-300 hover:underline" href="#transfers">International transfers</a></li>
          <li><a className="text-sky-300 hover:underline" href="#changes">Changes</a></li>
          <li><a className="text-sky-300 hover:underline" href="#contact">Contact</a></li>
        </ul>
      </nav>

      <div className="mt-8 space-y-8">
        <Section id="who" title="1) Who we are">
          <p>
            YouMine (“we”, “us”) operates a platform connecting mining industry clients with consultants
            and contractors. Contact:{" "}
            <a className="text-sky-300 underline" href="mailto:info@youmine.com.au">
              info@YouMine.com.au
            </a>.
          </p>
        </Section>

        <Section id="scope" title="2) Scope">
          <p>
            This policy covers personal data processed when you browse our site, create an account,
            manage a consultant profile, browse consultants, or contact a consultant via our form.
          </p>
        </Section>

        <Section id="data-we-collect" title="3) Data we collect">
          <ul>
            <li>
              Data you provide: account details (name, email), profile content (company info, services,
              location, links), enquiries sent to consultants (subject, message, contact details).
            </li>
            <li>
              Data collected automatically: device info, IP address, approximate location, pages viewed,
              timestamps, basic event logs; cookies/identifiers for session continuity.
            </li>
            <li>
              Data from third parties: if you connect Google Places (e.g., Place ID), we may fetch public
              business details to display on your profile.
            </li>
          </ul>
        </Section>

        <Section id="how-we-use" title="4) How we use data">
          <ul>
            <li>Provide and improve the platform, listings, search, filters, and contact flows.</li>
            <li>Authenticate users, secure accounts, and prevent abuse or fraud.</li>
            <li>Send essential service emails (e.g., enquiry notifications to consultants).</li>
            <li>Understand usage to improve performance and features.</li>
            <li>Comply with legal obligations and enforce our Terms.</li>
          </ul>
        </Section>

        <Section id="legal-bases" title="5) Legal bases (GDPR)">
          <ul>
            <li>Contract: to operate your account and deliver requested features.</li>
            <li>Legitimate interests: platform security, basic analytics, improving the service.</li>
            <li>Consent: optional cookies or marketing (if/when used), which you can withdraw.</li>
            <li>Legal obligation: to meet compliance or law enforcement requests where applicable.</li>
          </ul>
        </Section>

        <Section id="cookies" title="6) Cookies & tracking">
          <p>
            We use essential cookies for authentication and session continuity. We may use preference and
            performance cookies to enhance UX. If we add non‑essential tracking, we’ll provide controls to
            manage consent.
          </p>
        </Section>

        <Section id="analytics" title="7) Analytics, email delivery, and integrations">
          <ul>
            <li>
              Supabase: authentication and database services; may log basic request metadata to ensure
              reliability and security.
            </li>
            <li>
              Email delivery (e.g., Postmark): used to send consultant enquiry notifications. We prefer
              minimal tracking; if open/click tracking is enabled, it’s for reliability and deliverability
              monitoring.
            </li>
            <li>
              Google services (e.g., Maps/Places) if you provide a Place ID to display public business info.
            </li>
          </ul>
        </Section>

        <Section id="sharing" title="8) Sharing with third parties">
          <ul>
            <li>
              Service providers processing data under contract (hosting, auth, email, analytics). We require
              appropriate confidentiality and security commitments.
            </li>
            <li>
              Legal or safety reasons (e.g., to comply with law, enforce Terms, protect users or the Service).
            </li>
            <li>No sale of personal data.</li>
          </ul>
        </Section>

        <Section id="retention" title="9) Data retention">
          <p>
            We keep personal data only as long as necessary for the purposes above, and as required by law.
            You can request deletion of your account or certain data, subject to legal and safety constraints.
          </p>
        </Section>

        <Section id="security" title="10) Security">
          <p>
            We use reasonable technical and organisational measures to protect personal data. No system can
            be 100% secure; please use strong, unique passwords and keep them confidential.
          </p>
        </Section>

        <Section id="rights" title="11) Your privacy rights">
          <ul>
            <li>
              Depending on your location, you may have rights to access, correct, delete, or port your data,
              object to or restrict processing, and withdraw consent.
            </li>
            <li>
              To exercise rights, contact{" "}
              <a className="text-sky-300 underline" href="mailto:info@youmine.com.au">
                info@YouMine.com.au
              </a>. We may need to verify your identity.
            </li>
          </ul>
        </Section>

        <Section id="kids" title="12) Children’s privacy">
          <p>
            YouMine is not intended for children under 16. We do not knowingly collect personal data from
            children. If you believe a child has provided data, contact us to request deletion.
          </p>
        </Section>

        <Section id="transfers" title="13) International data transfers">
          <p>
            We may process data in countries outside your own. Where required, we rely on appropriate legal
            mechanisms (e.g., contractual safeguards) to protect personal data during transfers.
          </p>
        </Section>

        <Section id="changes" title="14) Changes to this policy">
          <p>
            We may update this Privacy Policy to reflect changes in our practices or legal requirements.
            We’ll post updates here and adjust the “Last updated” date.
          </p>
        </Section>

        <Section id="contact" title="15) Contact us">
          <p>
            Questions or requests? Email{" "}
            <a className="text-sky-300 underline" href="mailto:info@youmine.com.au">
              info@YouMine.com.au
            </a>.
          </p>
        </Section>
      </div>
    </main>
  );
}