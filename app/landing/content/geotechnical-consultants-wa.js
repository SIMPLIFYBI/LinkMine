// Geotechnical WA landing entry (moved out of registry)
const entry = {
  slug: "geotechnical-consultants-wa",
  title: "Mining Geotechnical Consultants – Western Australia",
  description:
    "Find Western Australia mining geotechnical consultants for pit slope design, underground ground support, monitoring, hydrogeology interfaces, TSF stability and study inputs across Pilbara, Goldfields, Yilgarn and more.",
  // Keep serviceSlug for this page (or switch to a categorySlug if you have one)
  serviceSlug: "geotechnical",
  regionLabel: "Western Australia",

  hero: {
    heading: "Mining Geotechnical Consultants — Western Australia",
    subheading:
      "Locate WA‑experienced geotechnical consultants for pit slope, underground ground support, monitoring integration and study inputs. YouMine is a directory; consultants provide the engineering.",
  },

  problem: [
    "Reactive interventions consume equipment hours and reduce production KPIs.",
    "Late geotechnical updates force redesigns and compress study gate timelines.",
    "Monitoring data sits in silos without clear TARPs to trigger action.",
    "Generic support and conservative assumptions raise cost or miss key risks.",
    "Pore pressures aren’t integrated into acceptance criteria, increasing slope risk.",
  ],

  services: [
    {
      title: "Site investigation and data acquisition",
      bullets: [
        "Core and face logging (RMR/Q), structural mapping and stereonet interpretation",
        "Lab program design and interpretation (UCS, triaxial, direct shear, point load, density, moisture)",
      ],
    },
    {
      title: "Slope and pit design support",
      bullets: [
        "Kinematic and probabilistic stability assessments; limit equilibrium and numerical modelling (FLAC, RS2, 3DEC where needed)",
        "Inter‑ramp and bench design geometry, catch capacity, dilation/back‑break reconciliation",
        "Depressurisation strategy aligned to structure and pore pressure targets",
      ],
    },
    {
      title: "Underground geotechnical engineering",
      bullets: [
        "Ground support design/optimisation (Q, Mathews, yielding elements for squeeze ground)",
        "Intersection and sill pillar stability, extraction sequence constraints",
        "Seismic hazard assessment and exclusion zones",
      ],
    },
    {
      title: "Hydrogeology interface",
      bullets: [
        "Piezometer network layout, pressure trend interpretation",
        "Link pore pressure reduction to slope FOS uplift and monitoring thresholds",
      ],
    },
    {
      title: "TSF and waste landform geotechnics",
      bullets: [
        "Starter/raise stability review, interface shear strength, liquefaction screening",
        "Closure stability, erosion susceptibility, drainage and cover thickness rationale",
      ],
    },
    {
      title: "Monitoring integration",
      bullets: [
        "Slope radar deployment, prism spacing, convergence/extensometer workflows",
        "Practical TARPs tied to measured deformation rates",
      ],
    },
    {
      title: "Study and due diligence inputs",
      bullets: [
        "Scoping/PFS/DFS design criteria, risk registers, acceptance notes, independent reviews",
      ],
    },
    {
      title: "Operational coverage and advisory",
      bullets: [
        "Short‑term site fill for geotech roles, wall inspections, ground support QA, incident investigation mentoring",
      ],
    },
  ],

  where: {
    regions: ["Pilbara", "Goldfields–Esperance", "Yilgarn", "Mid West", "Kimberley", "South West", "Peel"],
    commodities: ["Iron ore", "Gold", "Nickel", "Lithium", "Critical minerals"],
    methods: ["Large open pits", "Satellite pits", "Deep underground (SLS, bench stoping, room‑and‑pillar)", "Decline development"],
    delivery: ["FIFO", "DIDO", "Perth‑based analysis with site campaigns", "Remote data review"],
    lifecycle: ["Concept", "Scoping", "PFS", "DFS", "Execution", "Operations", "Care & Maintenance", "Closure"],
  },

  proof: [
    {
      heading: "Pilbara multi‑phase cutback",
      body:
        "Reconciliation of radar vectors against structural domains isolated a wedge release mechanism. Targeted depressurisation and revised berms limited over‑break while preserving ramp alignment.",
    },
    {
      heading: "Goldfields underground convergence",
      body:
        "Convergence monitoring showed load shedding in existing bolts. Yielding support plus adjusted firing and paste fill sequence stabilised the drive with clear triggers.",
    },
    {
      heading: "Lithium saprolite wall post‑rain",
      body:
        "Pore pressure sensitivity analysis and staged trim design enabled continuous access while instruments confirmed dissipation to target.",
    },
  ],

  who: [
    "Technical Services Managers needing geotech inputs aligned to mine design iterations",
    "Study Managers requiring defensible design criteria and calc packs at each gate",
    "Geology and Geotech teams seeking surge capacity for mapping, monitoring, TARPs",
    "Owners’ teams requesting independent review before board/JV/lender milestones",
    "Mine Managers wanting operational controls tied to production windows",
  ],

  engagement: [
    "Requirement definition: commodity, method, depth, structures, decision date",
    "Data provision: models, mapping, lab results, monitoring exports, design assumptions",
    "Scope confirmation: methods, acceptance criteria, deliverables, timeline, risks",
    "Execution: field acquisition (if needed), modelling/design, drafts and refinement",
    "Close‑out: drawings/support classes, TARP/risk updates, implementation notes",
  ],

  faqs: [
    {
      q: "Does YouMine supply engineering advice?",
      a: "No. YouMine lists independent consultants. All engineering judgement and deliverables originate from the engaged consultant.",
    },
    {
      q: "How quickly can a desktop review start?",
      a: "If core datasets are prepared, many consultants can start within a few business days, subject to availability.",
    },
    {
      q: "Can I secure short‑term site coverage?",
      a: "Yes. Many consultants offer rostered coverage for inspections, daily geotech reporting, TARP management and support QA.",
    },
    {
      q: "What deliverables come with a slope design update?",
      a: "Design geometry, catch capacity validation, assumptions register, factors of safety or probability outputs, and monitoring recommendations.",
    },
    {
      q: "How are pore pressures integrated into slope design?",
      a: "Consultants set pore pressure targets on controlling structures/failure surfaces and verify via piezometer trends, not generic factors.",
    },
  ],
};

export default entry;