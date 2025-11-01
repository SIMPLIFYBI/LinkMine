export const metadata = {
  title: "Terms & Conditions · MineLink",
  description:
    "Read MineLink’s Terms & Conditions covering account use, marketplace roles, acceptable use, intellectual property, warranties, liability, and dispute resolution.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms & Conditions · MineLink",
    description:
      "Read MineLink’s Terms & Conditions covering account use, marketplace roles, acceptable use, intellectual property, warranties, liability, and dispute resolution.",
    url: "/terms",
    type: "website",
  },
};

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10">
        <div className="prose prose-invert max-w-none prose-p:my-3 prose-li:my-1">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="relative mx-auto w-full max-w-4xl px-4 py-10">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <header>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Legal
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-sm text-slate-300">Last updated: {lastUpdated}</p>
        <p className="mt-3 text-slate-300">
          These Terms govern your access to and use of MineLink (the “Service”). By using the Service,
          you agree to these Terms. If you use the Service on behalf of a company or organization,
          you represent that you are authorized to bind that entity to these Terms.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          This template is provided for general informational purposes and is not legal advice. For
          maximum protection, have your lawyer review and customize these Terms for your jurisdiction
          and business.
        </p>
      </header>

      {/* Table of contents with anchor jumps */}
      <nav aria-label="Table of contents" className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10">
        <ul className="grid gap-2 sm:grid-cols-2 text-sm">
          <li><a className="text-sky-300 hover:underline" href="#definitions">Definitions</a></li>
          <li><a className="text-sky-300 hover:underline" href="#eligibility">Eligibility</a></li>
          <li><a className="text-sky-300 hover:underline" href="#accounts">Accounts & Security</a></li>
          <li><a className="text-sky-300 hover:underline" href="#acceptable-use">Acceptable Use</a></li>
          <li><a className="text-sky-300 hover:underline" href="#marketplace-role">Our Marketplace Role</a></li>
          <li><a className="text-sky-300 hover:underline" href="#consultants">Consultant Terms</a></li>
          <li><a className="text-sky-300 hover:underline" href="#clients">Client Terms</a></li>
          <li><a className="text-sky-300 hover:underline" href="#fees">Fees & Payments</a></li>
          <li><a className="text-sky-300 hover:underline" href="#content">User Content</a></li>
          <li><a className="text-sky-300 hover:underline" href="#ip">Intellectual Property</a></li>
          <li><a className="text-sky-300 hover:underline" href="#privacy">Privacy & Data</a></li>
          <li><a className="text-sky-300 hover:underline" href="#third-party">Third‑Party Services</a></li>
          <li><a className="text-sky-300 hover:underline" href="#warranties">Disclaimers</a></li>
          <li><a className="text-sky-300 hover:underline" href="#liability">Limitation of Liability</a></li>
          <li><a className="text-sky-300 hover:underline" href="#indemnity">Indemnification</a></li>
          <li><a className="text-sky-300 hover:underline" href="#termination">Suspension & Termination</a></li>
          <li><a className="text-sky-300 hover:underline" href="#disputes">Governing Law & Disputes</a></li>
          <li><a className="text-sky-300 hover:underline" href="#changes">Changes to the Service/Terms</a></li>
          <li><a className="text-sky-300 hover:underline" href="#contact">Contact</a></li>
        </ul>
      </nav>

      <div className="mt-8 space-y-8">
        <Section id="definitions" title="1) Definitions">
          <ul>
            <li>
              “Service” means the MineLink website, apps, and related features that connect consultants
              and clients in the mining industry.
            </li>
            <li>
              “Consultant” means a professional or organisation offering services via MineLink.
            </li>
            <li>
              “Client” means an individual or organisation seeking to engage Consultants.
            </li>
            <li>
              “Content” means text, images, data, profiles, listings, messages, and other material posted or transmitted on the Service.
            </li>
          </ul>
        </Section>

        <Section id="eligibility" title="2) Eligibility">
          <p>
            You must be capable of forming a binding contract and comply with all applicable laws. If
            you register on behalf of a business, you must be authorised to bind that business.
          </p>
        </Section>

        <Section id="accounts" title="3) Accounts & Security">
          <ul>
            <li>You are responsible for your account credentials and for all activity under your account.</li>
            <li>Provide accurate, up‑to‑date information and keep it updated.</li>
            <li>Notify us promptly of any unauthorised access or suspected breach.</li>
          </ul>
        </Section>

        <Section id="acceptable-use" title="4) Acceptable Use">
          <ul>
            <li>No unlawful, infringing, deceptive, defamatory, or harmful activity.</li>
            <li>No attempts to bypass security, scrape at scale, or disrupt the Service.</li>
            <li>No posting of Content that you do not have the right to share.</li>
            <li>Respect rate limits, privacy, and other users’ rights.</li>
          </ul>
        </Section>

        <Section id="marketplace-role" title="5) Our Marketplace Role">
          <p>
            MineLink is a venue that facilitates introductions between Consultants and Clients. We do
            not employ Consultants, provide consulting services, or guarantee outcomes. We are not a party
            to any contract between Consultants and Clients, and we do not control, supervise, or warrant
            the quality, safety, legality, or suitability of services offered or purchased.
          </p>
        </Section>

        <Section id="consultants" title="6) Consultant Terms">
          <ul>
            <li>You are solely responsible for the accuracy of your profile and listings.</li>
            <li>You must comply with applicable licensing, safety, and regulatory obligations.</li>
            <li>
              You grant MineLink a worldwide, non‑exclusive, royalty‑free licence to host, display, and
              promote your public profile Content to operate and improve the Service.
            </li>
            <li>You must handle Client enquiries professionally and keep confidential information secure.</li>
          </ul>
        </Section>

        <Section id="clients" title="7) Client Terms">
          <ul>
            <li>Use the directory and filters to evaluate suitability; perform your own due diligence.</li>
            <li>Any engagement terms are between you and the Consultant.</li>
            <li>You must not misrepresent a brief, budget, or urgency to solicit free work.</li>
          </ul>
        </Section>

        <Section id="fees" title="8) Fees & Payments">
          <p>
            We may offer free and paid features. If fees apply, you agree to pay all charges and taxes
            described at checkout or in an order form. Except where required by law, payments are non‑refundable.
            We may change pricing on notice for future terms.
          </p>
        </Section>

        <Section id="content" title="9) User Content & Moderation">
          <ul>
            <li>
              You retain ownership of your Content. You grant MineLink a licence to use it solely to
              provide and promote the Service.
            </li>
            <li>
              We may remove or restrict Content or accounts that violate these Terms or applicable law.
            </li>
            <li>
              You warrant that your Content does not infringe third‑party rights and complies with law.
            </li>
          </ul>
        </Section>

        <Section id="ip" title="10) Intellectual Property">
          <p>
            The Service, including our trademarks, UI, and code, is owned by MineLink or our licensors
            and protected by IP laws. No rights are granted except as expressly set out in these Terms.
          </p>
        </Section>

        <Section id="privacy" title="11) Privacy & Data">
          <p>
            Our collection and use of personal data is described in our{" "}
            <a className="text-sky-300 underline" href="/privacy">Privacy Policy</a>. You must comply with
            applicable data protection laws when using the Service.
          </p>
        </Section>

        <Section id="third-party" title="12) Third‑Party Services">
          <p>
            The Service may integrate third‑party tools (e.g., email providers, analytics, maps). We are
            not responsible for third‑party services or their terms; your use of them is at your discretion.
          </p>
        </Section>

        <Section id="warranties" title="13) Disclaimers">
          <ul>
            <li>The Service is provided “as is” and “as available”.</li>
            <li>
              We disclaim all warranties, express or implied, including merchantability, fitness for a
              particular purpose, and non‑infringement.
            </li>
            <li>
              We do not warrant the accuracy, availability, or reliability of Content or third‑party services.
            </li>
          </ul>
        </Section>

        <Section id="liability" title="14) Limitation of Liability">
          <p>
            To the maximum extent permitted by law, MineLink and its affiliates, directors, employees,
            and suppliers will not be liable for indirect, incidental, special, consequential, exemplary, or
            punitive damages, or for lost profits, revenues, data, or goodwill, arising from or related to the
            Service or these Terms, even if advised of the possibility. Our aggregate liability for all claims
            shall not exceed the greater of: (a) the amounts you paid to us for the Service in the 6 months
            preceding the claim, or (b) USD $100.
          </p>
        </Section>

        <Section id="indemnity" title="15) Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless MineLink from any claims, damages, losses,
            liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to
            your Content, your use of the Service, or your breach of these Terms.
          </p>
        </Section>

        <Section id="termination" title="16) Suspension & Termination">
          <p>
            We may suspend or terminate access immediately for any violation of these Terms, suspected
            fraud, legal risk, or to protect the Service or users. You may stop using the Service at any time.
            Sections that by their nature should survive (e.g., IP, disclaimers, liability, indemnity) will survive.
          </p>
        </Section>

        <Section id="disputes" title="17) Governing Law & Disputes">
          <p>
            These Terms are governed by the laws of [Insert jurisdiction]. The courts located in
            [Insert venue] will have exclusive jurisdiction. Where permitted by law, you and MineLink
            waive any right to a jury trial and to participate in a class action. If you’d prefer binding
            arbitration, replace this clause with your arbitration terms (e.g., rules, seat, language).
          </p>
        </Section>

        <Section id="changes" title="18) Changes to the Service or Terms">
          <p>
            We may modify the Service or these Terms from time to time. Material changes will be posted
            here with an updated date. Your continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section id="contact" title="19) Contact">
          <p>
            Questions about these Terms? Contact us at{" "}
            <a className="text-sky-300 underline" href="mailto:info@youmine.com.au">
              info@YouMine.com.au
            </a>.
          </p>
        </Section>
      </div>
    </main>
  );
}