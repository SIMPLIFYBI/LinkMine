export const revalidate = 300; // 5 minutes

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Code2, FileSpreadsheet, FileText, FolderOpen, Globe2, PackageOpen, UsersRound } from "lucide-react";
import ServiceFinder from "@/app/components/ServiceFinder";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { resolveResourceConsultantIcons } from "@/lib/resourceHubServer";
import AddProfileSmartCTA from "@/app/components/consultants/AddProfileSmartCTA.client.jsx";
import WelcomeAccountModal from "@/app/components/WelcomeAccountModal.client.jsx";
import DidYouKnowSection from "./components/stats/DidYouKnowSection.jsx";
import {
  siteMarketLabel,
} from "@/lib/siteMarket";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";

const heroImage = "/Pictures/pexels-urtimud-89-76108288-14263363.jpg";

function getHomeCopy(market) {
  if (market === "oil_gas") {
    return {
      title: "YouMine — Find oil & gas consultants and contractors fast",
      description:
        "YouMine connects oil & gas teams with trusted consultants and contractors. Browse services, view portfolios, and contact experts directly.",
      heroAlt: "YouMine — consultants and contractors in oil and gas",
      heroTitle: "Match with the right oil & gas expert today.",
      heroDescription:
        "Discover trusted consultants and contractors across subsurface, wells, facilities, operations, and project delivery.",
      overviewTitle: "Connect oil & gas teams with trusted contractors & consultants",
      overviewDescription:
        "YouMine helps operators, asset teams, and project leads find qualified oil & gas contractors and consultants fast — with portfolios, verified business details, service categories, and Google-linked profiles.",
      featuredTitle: "Featured oil & gas consultants",
      industryLabel: "oil & gas",
    };
  }

  if (market === "both") {
    return {
      title: "YouMine — Find mining and oil & gas consultants fast",
      description:
        "YouMine connects mining and oil & gas teams with trusted consultants and contractors. Browse services, view portfolios, and contact experts directly.",
      heroAlt: "YouMine — consultants and contractors across mining and oil and gas",
      heroTitle: "Everything mining. One platform.",
      heroDescription:
        "Connect with industry experts, discover new opportunities, find talent, explore events and training, and access the digital tools shaping the future of mining. All in one place.",
      overviewTitle: "Connect industry teams with trusted contractors & consultants",
      overviewDescription:
        "YouMine helps mining and oil & gas teams find qualified contractors and consultants fast — with portfolios, verified business details, service categories, and Google-linked profiles.",
      featuredTitle: "Featured consultants across both markets",
      industryLabel: "mining and oil & gas",
    };
  }

  return {
    title: "YouMine — Find mining consultants and contractors fast",
    description:
      "YouMine connects mining clients with trusted consultants and contractors. Browse services, view portfolios, and contact experts directly.",
    heroAlt: "YouMine — consultants and contractors in mining",
    heroTitle: "Everything mining. One platform.",
    heroDescription:
      "Discover trusted consultants and contractors, review portfolios, and contact directly.",
    overviewTitle: "Connect mining clients with trusted contractors & consultants",
    overviewDescription:
      "YouMine helps mining companies find qualified contractors and consultants fast — with portfolios, verified business details, service categories, and Google-linked profiles. For consultants, it’s the easiest way to showcase your work, build credibility, and track profile metrics.",
    featuredTitle: "Featured consultants",
    industryLabel: "mining",
  };
}

export async function generateMetadata() {
  const { market } = await getResolvedSiteMarket();
  const copy = getHomeCopy(market);

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: "/",
      siteName: "YouMine",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YouMine" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: ["/og-image.png"],
    },
  };
}

function interleaveLists(lists) {
  const merged = [];
  const seen = new Set();
  let index = 0;

  while (true) {
    let foundRow = false;
    for (const list of lists) {
      const row = list[index];
      if (!row) continue;
      foundRow = true;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }
    if (!foundRow) break;
    index += 1;
  }

  return merged;
}

async function getStatsAndFeatured(market) {
  try {
    const sb = supabasePublicServer();

    if (market === "both") {
      const [{ data: miningFeatured = [] }, { data: oilGasFeatured = [] }, { data: allCategories = [] }, { data: services = [] }] = await Promise.all([
        sb.rpc("get_consultants_directory_page", {
          p_page: 1,
          p_page_size: 24,
          p_seed_bucket: "home-featured",
          p_market: "mining",
          p_profile_surface: "consultant",
        }),
        sb.rpc("get_consultants_directory_page", {
          p_page: 1,
          p_page_size: 24,
          p_seed_bucket: "home-featured",
          p_market: "oil_gas",
          p_profile_surface: "consultant",
        }),
        sb
          .from("service_categories")
          .select("id, name, slug, market")
          .in("market", ["mining", "oil_gas"])
          .order("position", { ascending: true })
          .order("name", { ascending: true }),
        sb
          .from("services")
          .select("id, name, slug, category_id, market")
          .in("market", ["mining", "oil_gas"])
          .order("name", { ascending: true }),
      ]);

      const featured = interleaveLists([
        (miningFeatured || []).map(({ has_next, ...consultant }) => consultant),
        (oilGasFeatured || []).map(({ has_next, ...consultant }) => consultant),
      ]);

      const searchCategories = allCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        services: services
          .filter((service) => service.category_id === category.id)
          .map((service) => ({
            id: service.id,
            name: service.name,
            slug: service.slug,
          })),
      }));

      return { featured, categories: allCategories.slice(0, 9), searchCategories };
    }

    const { data: featuredRows = [] } = await sb.rpc("get_consultants_directory_page", {
      p_page: 1,
      p_page_size: 24,
      p_seed_bucket: "home-featured",
      p_market: market,
      p_profile_surface: "consultant",
    });

    const featured = (featuredRows || []).map(({ has_next, ...consultant }) => consultant);

    // LIMIT TO 9 categories for 3x3 layout
    const { data: categories = [] } = await sb
      .from("service_categories")
      .select("id, name, slug")
      .eq("market", market)
      .order("position", { ascending: true })
      .order("name", { ascending: true })
      .limit(9);

    const [{ data: allCategories = [] }, { data: services = [] }] = await Promise.all([
      sb
        .from("service_categories")
        .select("id, name, slug")
        .eq("market", market)
        .order("position", { ascending: true })
        .order("name", { ascending: true }),
      sb
        .from("services")
        .select("id, name, slug, category_id")
        .eq("market", market)
        .order("name", { ascending: true }),
    ]);

    const searchCategories = allCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      services: services
        .filter((service) => service.category_id === category.id)
        .map((service) => ({
          id: service.id,
          name: service.name,
          slug: service.slug,
        })),
    }));

    return { featured, categories, searchCategories };
  } catch {
    return { featured: [], categories: [], searchCategories: [] };
  }
}

async function getFeaturedResources() {
  try {
    const sb = supabasePublicServer();
    const { data, error } = await sb
      .from("resources")
      .select("id, owner_user_id, consultant_id, title, slug, summary, resource_format, resource_type, download_count, open_count, is_featured, resource_categories ( name )")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    const resources = data || [];
    const iconByResourceId = await resolveResourceConsultantIcons(sb, resources);
    return resources.map((resource) => ({
      ...resource,
      consultantIconUrl: iconByResourceId.get(resource.id) || null,
    }));
  } catch {
    return [];
  }
}

const RESOURCE_FORMAT_META = {
  website: { label: "Website", Icon: Globe2, chip: "border-cyan-300/30 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 text-cyan-50", icon: "border-cyan-200/40 bg-cyan-300/20 text-cyan-100", orb: "-right-10 top-3 h-24 w-24 rounded-full border border-cyan-100/35 bg-cyan-200/18", block: "bottom-[-10%] right-[14%] h-20 w-20 rotate-[16deg] rounded-[22px] border border-cyan-100/30 bg-cyan-950/24", hues: [191, 204, 188] },
  repository: { label: "Repository", Icon: Code2, chip: "border-emerald-300/30 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-50", icon: "border-emerald-200/40 bg-emerald-300/20 text-emerald-100", orb: "-right-11 top-2 h-24 w-24 rounded-[28px] border border-emerald-100/30 bg-emerald-200/16", block: "bottom-[-12%] right-[20%] h-16 w-24 -rotate-[11deg] rounded-[16px] border border-emerald-100/25 bg-emerald-950/26", hues: [156, 173, 148] },
  excel: { label: "Spreadsheet", Icon: FileSpreadsheet, chip: "border-green-300/30 bg-gradient-to-r from-green-500/25 to-lime-500/20 text-green-50", icon: "border-green-200/40 bg-green-300/20 text-green-100", orb: "-right-9 top-3 h-20 w-20 rounded-[20px] border border-green-100/32 bg-green-200/16", block: "bottom-[-14%] right-[16%] h-20 w-20 rotate-[4deg] rounded-[12px] border border-green-100/24 bg-green-950/28", hues: [128, 96, 112] },
  word: { label: "Document", Icon: FileText, chip: "border-blue-300/30 bg-gradient-to-r from-blue-500/25 to-indigo-500/20 text-blue-50", icon: "border-blue-200/40 bg-blue-300/20 text-blue-100", orb: "-right-10 top-3 h-24 w-24 rounded-full border border-blue-100/35 bg-blue-200/16", block: "bottom-[-12%] right-[16%] h-16 w-24 rotate-[8deg] rounded-[20px] border border-blue-100/26 bg-blue-950/24", hues: [216, 236, 206] },
  powerpoint: { label: "Slide deck", Icon: FileText, chip: "border-orange-300/30 bg-gradient-to-r from-orange-500/25 to-amber-500/20 text-orange-50", icon: "border-orange-200/40 bg-orange-300/20 text-orange-100", orb: "-right-8 top-3 h-20 w-20 rounded-full border border-orange-100/35 bg-orange-200/16", block: "bottom-[-10%] right-[14%] h-[4.5rem] w-[5.5rem] -rotate-[14deg] rounded-[16px] border border-orange-100/26 bg-orange-950/26", hues: [24, 40, 32] },
  script: { label: "Script", Icon: Code2, chip: "border-violet-300/30 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 text-violet-50", icon: "border-violet-200/40 bg-violet-300/20 text-violet-100", orb: "-right-10 top-2 h-24 w-24 rounded-[24px] border border-violet-100/34 bg-violet-200/16", block: "bottom-[-14%] right-[18%] h-[4.5rem] w-20 rotate-[24deg] rounded-[12px] border border-violet-100/24 bg-violet-950/30", hues: [268, 304, 286] },
  app: { label: "App", Icon: PackageOpen, chip: "border-pink-300/30 bg-gradient-to-r from-pink-500/25 to-rose-500/20 text-pink-50", icon: "border-pink-200/40 bg-pink-300/20 text-pink-100", orb: "-right-10 top-3 h-[5.5rem] w-[5.5rem] rounded-[26px] border border-pink-100/32 bg-pink-200/16", block: "bottom-[-12%] right-[17%] h-20 w-16 -rotate-[18deg] rounded-[20px] border border-pink-100/25 bg-pink-950/26", hues: [336, 351, 324] },
  pdf: { label: "PDF", Icon: FileText, chip: "border-red-300/30 bg-gradient-to-r from-red-500/25 to-rose-500/20 text-red-50", icon: "border-red-200/40 bg-red-300/20 text-red-100", orb: "-right-9 top-3 h-[5.5rem] w-[5.5rem] rounded-full border border-red-100/34 bg-red-200/16", block: "bottom-[-12%] right-[15%] h-20 w-[4.5rem] rotate-[10deg] rounded-[14px] border border-red-100/26 bg-red-950/28", hues: [5, 350, 14] },
  generic: { label: "Resource", Icon: FolderOpen, chip: "border-slate-300/30 bg-gradient-to-r from-slate-600/35 to-slate-500/20 text-slate-100", icon: "border-slate-200/35 bg-slate-300/20 text-slate-100", orb: "-right-9 top-4 h-24 w-24 rounded-full border border-white/12 bg-white/10", block: "bottom-[-10%] right-[16%] h-20 w-20 rotate-12 rounded-[22px] border border-white/12 bg-slate-950/16", hues: [210, 222, 198] },
};

function getResourceArtwork(resource, format) {
  const [base, accent, glow] = format.hues;
  const seed = String(resource.resource_categories?.name || resource.title || "resource");
  const drift = Array.from(seed).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 28, 0) - 14;
  return `radial-gradient(circle at 20% 16%, hsla(${(glow + drift + 360) % 360},90%,72%,0.28), transparent 28%), linear-gradient(145deg, hsla(${(base + drift + 360) % 360},58%,44%,0.94), hsla(${(accent + drift + 360) % 360},64%,26%,0.84))`;
}

export default async function HomePage() {
  const showPreview = true;
  const { market } = await getResolvedSiteMarket();
  const marketName = siteMarketLabel(market);
  const copy = getHomeCopy(market);
  const [{ featured, searchCategories }, featuredResources] = await Promise.all([
    getStatsAndFeatured(market),
    getFeaturedResources(),
  ]);

  // Deterministic daily rotation (UTC) for featured
  const tzOffsetMinutes = 0;
  const now = new Date(Date.now() + tzOffsetMinutes * 60_000);
  const dayKey = now.toISOString().slice(0, 10);

  const seedFromString = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
      h >>>= 0;
    }
    return h >>> 0;
  };
  const mulberry32 = (a) => () => {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const seededShuffle = (arr, seed) => {
    const rng = mulberry32(seed);
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const rotatedFeatured = seededShuffle(featured, seedFromString(dayKey)).slice(0, 3);

  const sampleListings = [
    { id: 1, name: "Acme Drilling", services: "Drilling • Sampling", location: "Kalgoorlie, WA" },
    { id: 2, name: "GeoConsult", services: "Geotech • Logging", location: "Perth, WA" },
    { id: 3, name: "CoreWorks", services: "Core Processing • Analysis", location: "Adelaide, SA" },
  ];

  const testimonials = [
    {
      name: "Mark Hayes",
      role: "Project Lead, CoreWorks",
      quote:
        "Clear profiles and direct contact made shortlisting effortless. We saved a heap of back-and-forth.",
    },
    {
      name: "",
      role: "Senior Engineer, Open Pit Solutions",
      quote:
        "Found exactly the expertise we needed on a tight timeline. Great experience end-to-end.",
    },
    {
      name: "",
      role: "CTO, SimplifyBI",
      quote:
        " We love the platform, this makes it som much easier to connect with clients",
    },
  ];

  // JSON-LD (Organization + FAQ)
  const faqItems = [
    {
      q: "How do I contact a consultant?",
      a: "Open the consultant’s profile and use the Contact button to send a message directly.",
    },
    {
      q: "How does YouMine verify profiles?",
      a: "Profiles are linked to authenticated users and reviewed before approval.",
    },
    {
      q: "Can I add a portfolio?",
      a: "Yes. Consultants can upload a logo, images, and a PDF to showcase projects.",
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "YouMine",
        "url": "https://youmine.io",
        "logo": "https://youmine.io/og-image.png",
        "contactPoint": [{ "@type": "ContactPoint", "email": "info@youmine.com.au", "contactType": "customer support" }],
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqItems.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
    ],
  };

  const discoveryPillars = [
    {
      title: "Experts and talent",
      description: "Find specialist capability, compare profiles, and connect directly with the people who can move your work forward.",
      href: "/consultants",
      action: "Find experts",
      Icon: UsersRound,
      accent: "cyan",
      graphic: "Capability map",
    },
    {
      title: "Jobs and opportunities",
      description: "Discover contract and freelance work, or put the right opportunity in front of the mining community.",
      href: "/jobs",
      action: "Explore jobs",
      Icon: BriefcaseBusiness,
      accent: "amber",
      graphic: "Opportunity board",
    },
    {
      title: "Training and events",
      description: "Keep pace with industry learning, upcoming events, and the training that keeps teams ready for site.",
      href: "/whats-on",
      action: "See what's on",
      Icon: CalendarDays,
      accent: "violet",
      graphic: "Industry calendar",
    },
    {
      title: "Vault digital products",
      description: "Explore practical digital tools, resources, and downloads created for the realities of modern mining.",
      href: "/vault",
      action: "Open the Vault",
      Icon: FolderOpen,
      accent: "emerald",
      graphic: "Tool collection",
    },
  ];

  return (
    <main className="site-market-shell mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-10" data-market={market}>
      <WelcomeAccountModal />
      {/* Hero */}
      <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] min-h-[240px] md:min-h-[300px] overflow-hidden">
        <Image
          src={heroImage}
          alt={copy.heroAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative z-10 flex h-full items-center justify-center px-6 py-10 sm:px-12 md:py-14">
          <div className="w-full max-w-3xl rounded-2xl bg-black/28 p-5 text-center shadow-[0_18px_48px_-26px_rgba(0,0,0,0.8)] backdrop-blur-[1px] sm:p-7">
            <h1 className="text-3xl font-bold tracking-tight leading-tight text-[rgb(248,250,252)] sm:text-4xl lg:text-5xl">
              {copy.heroTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[rgba(241,245,249,0.95)] sm:text-lg">
              {copy.heroDescription}
            </p>
            <div className="mt-4 flex gap-2">
            <Link href="/signup" className="flex-1">
              <button
                className="
                  group relative flex w-full items-center justify-center
                  rounded-xl px-3 py-2
                  font-semibold tracking-tight leading-none
                  text-[12px] sm:text-[13px]
                  whitespace-nowrap min-w-[150px]
                  backdrop-blur-md
                  border border-sky-300/30 ring-1 ring-white/10
                  bg-gradient-to-r from-sky-500/35 via-indigo-500/35 to-sky-500/35
                  text-white
                  shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)]
                  transition
                  hover:from-sky-500/45 hover:via-indigo-500/45 hover:to-sky-500/45
                  hover:border-sky-300/50 hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.65)]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60
                "
                aria-label="Sign up — it's free"
              >
                Get started — it’s free
              </button>
            </Link>
            <Link href="/consultants" className="flex-1">
              <button
                className="
                  group relative flex w-full items-center justify-center
                  rounded-xl px-3 py-2
                  font-semibold tracking-tight leading-none
                  text-[12px] sm:text-[13px]
                  whitespace-nowrap min-w-[150px]
                  backdrop-blur-md
                  border border-white/15 ring-1 ring-white/10
                  bg-white/10 text-slate-100
                  shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)]
                  transition
                  hover:bg-white/15 hover:border-white/25 hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.65)]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/40
                "
                aria-label="Explore consultants"
              >
                Explore consultants
              </button>
            </Link>
            </div>
          </div>
        </div>

        {/* Flush separator line at bottom of hero */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 z-20 h-px w-full bg-gradient-to-r from-transparent via-sky-400/60 to-transparent"
        />
      </section>

      {/* Platform discovery */}
      <section id="overview" className="-mt-7 mx-auto w-full max-w-6xl px-2 md:px-4 fade-in-up">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Discover YouMine</p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-[32px]">Four ways to move mining forward</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            One connected platform for people, opportunities, industry learning, and the tools that make better work possible.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {discoveryPillars.map(({ title, description, href, action, Icon, accent, graphic }) => (
            <article key={title} className={`discovery-pillar discovery-pillar-${accent} group relative isolate min-h-[270px] overflow-hidden rounded-2xl border p-5 sm:p-6`}>
              <div className="discovery-pillar-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
              <div className="discovery-pillar-orbit pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border" aria-hidden="true" />

              <div className="relative flex h-full flex-col items-start">
                <div className="flex w-full items-start justify-between gap-4">
                  <span className="discovery-pillar-icon inline-flex h-11 w-11 items-center justify-center rounded-xl border">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300/75">{graphic}</span>
                </div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200/90">{description}</p>
                <Link href={href} className="discovery-pillar-action mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold" aria-label={action}>
                  {action}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Service finder (flush to previous separator line) */}
      <section
        id="search"
        className="
          relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw]
          pb-6
        "
      >
        {/* Inline separator line flush at very top */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent z-10"
        />

        {/* Background layers */}
        <div
          aria-hidden="true"
          className="
            absolute inset-0 -z-10
            bg-gradient-to-tr from-slate-950/85 via-slate-900/80 to-slate-950/85
          "
        />
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-0 -z-10
            bg-radial-fade
            mix-blend-plus-lighter
            opacity-60
          "
        />

        {/* Content wrapper (adds internal top spacing below line) */}
        <div className="mx-auto w-full max-w-screen-md px-6 sm:px-8 pt-5">
          <p className="section-label mb-2">Search</p>
          <ServiceFinder className="mt-2" initialCategories={searchCategories} />
        </div>
      </section>

      {/* Featured consultants */}
      <section id="featured" className="mx-auto w-full max-w-screen-lg px-4 fade-in-up">
        <p className="section-label mb-2">Featured</p>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{copy.featuredTitle}</h3>
          <Link href="/consultants" className="text-xs text-sky-300 underline-offset-2 hover:underline">
            View all
          </Link>
        </div>

        {rotatedFeatured.length === 0 ? (
          <p className="text-sm text-slate-300">New profiles are being approved—check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rotatedFeatured.map((c) => {
              const logo = c?.metadata?.logo?.url || "";
              return (
                <Link
                  key={c.id}
                  href={`/consultants/${c.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-[2px] hover:border-sky-300/30 hover:bg-white/[0.06] hover:shadow-[0_0_0_1px_rgba(125,211,252,0.25)]"
                >
                  {/* Gradient top bar accent */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500/70 via-cyan-400/70 to-sky-500/70" />

                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${c.display_name} logo`}
                          width={56}
                          height={56}
                          loading="lazy"
                          decoding="async"
                          className="h-14 w-14 object-contain"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-slate-300">
                          {c.display_name?.slice(0, 1) || "•"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold tracking-tight text-white">
                        {c.display_name}
                      </div>
                      {c.headline ? (
                        <div className="mt-1 line-clamp-2 text-sm text-slate-300">
                          {c.headline}
                        </div>
                      ) : null}
                      {c.location ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400/70" />
                          <span className="truncate">{c.location}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Verified profile</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-300">
                      View profile
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Soft glow on hover */}
                  <div
                    className="pointer-events-none absolute -inset-20 -z-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-10"
                    style={{ background: "radial-gradient(600px circle at 0% 0%, rgba(56,189,248,0.35), transparent 40%)" }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Vault resource rail */}
      <section id="vault-picks" className="vault-picks mx-auto w-full max-w-screen-lg px-4 fade-in-up">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="section-label mb-2">From the Vault</p>
            <h3 className="text-base font-semibold text-white">Digital Resources built for Mining</h3>
          </div>
          <Link href="/vault" className="shrink-0 text-xs font-semibold text-amber-200 underline-offset-2 hover:text-amber-100 hover:underline">
            Explore the Vault
          </Link>
        </div>

        {featuredResources.length === 0 ? (
          <p className="text-sm text-slate-300">New Vault resources are being curated now.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Featured Vault resources">
              {featuredResources.map((resource) => {
                const format = RESOURCE_FORMAT_META[resource.resource_format] || RESOURCE_FORMAT_META.generic;
                const FormatIcon = format.Icon;

                return (
                  <article
                    key={resource.id}
                    className="group relative flex h-[236px] w-full overflow-hidden rounded-[26px] border border-white/10 shadow-[0_24px_62px_-38px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 sm:h-[248px]"
                    style={{ backgroundImage: getResourceArtwork(resource, format) }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.84)_76%)]" />
                    <div className={`pointer-events-none absolute ${format.orb}`} aria-hidden="true" />
                    <div className={`pointer-events-none absolute ${format.block}`} aria-hidden="true" />
                    <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.8)]" style={{ backgroundImage: `linear-gradient(135deg,hsla(${format.hues[2]},90%,86%,0.95),hsla(${format.hues[0]},86%,70%,0.88))` }} aria-label="Resource creator">
                      <span aria-hidden={Boolean(resource.consultantIconUrl)}>
                        {resource.title.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "R"}
                      </span>
                      {resource.consultantIconUrl ? (
                        <img
                          src={resource.consultantIconUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="relative flex h-full flex-1 flex-col p-4">
                      <div>
                        <div className="min-h-[3.4rem] pr-14 sm:min-h-[3.75rem]">
                          <Link href={`/vault/${resource.id}`} className="block line-clamp-2 text-lg font-semibold tracking-tight text-white transition hover:text-sky-100">
                            {resource.title}
                          </Link>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${format.chip}`}>
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${format.icon}`}>
                              <FormatIcon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            {format.label}
                          </span>
                          <div className="text-xs text-slate-400">Vault pick</div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                          {resource.summary || "Open the resource to review the pack or linked source details."}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2.5 sm:gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">Included</div>
                            <div className="mt-1 line-clamp-1 max-w-[130px] text-[11px] text-slate-100/72 sm:max-w-[160px] sm:text-xs">{resource.resource_type === "external" ? "External source" : "Resource file"}</div>
                          </div>
                          <Link href={`/vault/${resource.id}`} className="inline-flex items-center justify-center rounded-full border border-sky-200/45 bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(59,130,246,0.92)_46%,rgba(14,165,233,0.95))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(14,165,233,0.95)] ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:border-sky-100/60 hover:shadow-[0_20px_38px_-16px_rgba(14,165,233,1)]">
                            View resource
                          </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>

      {/* Did You Know placed under Featured */}
      <DidYouKnowSection />

      <div aria-hidden="true" className="my-6 divider-gradient" />

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-strip relative mx-auto w-full max-w-screen-lg rounded-3xl px-4 py-8 fade-in-up bg-panel-alt">
        <p className="testimonials-kicker section-label mb-3 px-1">Testimonials</p>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="testimonials-title text-base font-semibold text-white">What clients say</h3>
          <span className="testimonials-meta text-xs text-slate-400">Real feedback from teams using YouMine</span>
        </div>

        <div className="-mx-4 overflow-hidden px-4">
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Testimonials"
          >
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="testimonials-card min-w-[280px] max-w-[360px] snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10"
              >
                <blockquote className="testimonials-quote text-sm leading-6 text-slate-200">
                  <span aria-hidden="true" className="testimonials-quote-mark mr-1 text-slate-400">“</span>
                  {t.quote}
                  <span aria-hidden="true" className="testimonials-quote-mark ml-1 text-slate-400">”</span>
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-3">
                  <div className="testimonials-avatar flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-xs font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/30">
                    {t.name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="testimonials-name truncate text-sm font-semibold text-white">{t.name}</div>
                    <div className="testimonials-role truncate text-xs text-slate-400">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div aria-hidden="true" className="testimonials-glow pointer-events-none absolute inset-0 rounded-3xl bg-radial-fade opacity-50 mix-blend-plus-lighter" />
      </section>

      {showPreview && (
        <section id="features" className="mx-auto max-w-screen-md px-4 pb-8 fade-in-up">
          <p className="section-label mb-2">Features</p>
          <h3 className="mb-3 text-lg font-semibold">Why YouMine?</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Feature title="Verified Listings" desc="Profiles linked to authenticated users and organizations." />
            <Feature title="Portfolios" desc="Showcase past projects with images and links." />
            <Feature title="Metrics" desc="Basic analytics for consultant profile views." />
            <Feature title="Favourites" desc="Save contractors and listings for later." />
          </div>
        </section>
      )}

      <div aria-hidden="true" className="my-6 divider-gradient" />

      {/* For clients */}
      <section id="clients" className="mt-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 fade-in-up">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">For clients</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">How YouMine works for Clients</h2>
          <p className="mt-1 text-sm text-slate-300">Post your job, compare specialists, and hire with confidence.</p>
        </header>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Step n={1} title="Post your job" desc="Describe your project, location, timeline, and budget to attract the right consultants." />
          <Step n={2} title="Review matches" desc="Compare profiles, experience, and proposals. Shortlist favourites and start a conversation." />
          <Step n={3} title="Hire and deliver" desc="Select the best fit and kick off quickly. Stay in touch and keep momentum through delivery." />
        </ol>

        {/* CTA: send clients to the consultants directory */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/consultants"
            prefetch
            className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          >
            Browse consultants
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </Link>

          {/* REPLACED: 'See directory' -> 'Create a Job' to open the Create tab on Jobs */}
          <Link
            href="/jobs?tab=my-jobs"
            prefetch
            className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            Create a Job
          </Link>
        </div>
      </section>

      <div aria-hidden="true" className="my-6 divider-gradient" />

      {/* For consultants */}
      <section id="consultants" className="mt-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 fade-in-up">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">For consultants</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">How YouMine works for Consultants</h2>
          <p className="mt-1 text-sm text-slate-300">Customize your profile, connect with clients, and get hired.</p>
        </header>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Step n={1} title="Customize your profile" desc="Highlight services, experience, locations, and a compelling bio. Keep it fresh to rank well." />
          <Step n={2} title="Find and contact clients" desc="Browse posted jobs that match your skills and reach out directly with tailored proposals." />
          <Step n={3} title="Get discovered and hired" desc="Clients can contact you directly. Reply fast to turn enquiries into engagements." />
        </ol>

        {/* CTA: consultants add their profile (conditional on auth) */}
        <div className="mt-6">
          <AddProfileSmartCTA />
        </div>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-300">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">{n}</span>
        Step {n}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
    </li>
  );
}