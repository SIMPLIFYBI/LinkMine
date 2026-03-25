const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function asObject(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function buildStoragePublicUrl(supabaseUrl, bucket, path) {
  if (!supabaseUrl || !bucket || !path) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${String(path).replace(/^\//, "")}`;
}

function pickLogoFromConsultantMetadata(metadata) {
  const m = asObject(metadata);
  if (!m) return null;

  const direct =
    m.logo_url ||
    m.logoUrl ||
    m.avatar_url ||
    m.avatarUrl ||
    m.image_url ||
    m.imageUrl ||
    m.photo_url ||
    m.photoUrl;

  if (typeof direct === "string" && direct.startsWith("http")) return direct;

  const logoObj = asObject(m.logo) || asObject(m.branding?.logo) || asObject(m.profile?.logo);
  const nestedUrl = logoObj?.url || logoObj?.publicUrl;
  if (typeof nestedUrl === "string" && nestedUrl.startsWith("http")) return nestedUrl;

  const bucket = logoObj?.bucket || m.logo_bucket || m.bucket;
  const path = logoObj?.path || logoObj?.key || m.logo_path || m.path;
  if (bucket && path) return buildStoragePublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, bucket, path);

  const maybePath = nestedUrl || logoObj?.path || direct;
  if (typeof maybePath === "string") {
    const cleaned = maybePath.replace(/^\//, "");
    const parts = cleaned.split("/");
    if (parts.length >= 2) {
      const maybeBucket = parts[0];
      const rest = parts.slice(1).join("/");
      if (maybeBucket === "portfolio" || maybeBucket === "public") {
        return buildStoragePublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, maybeBucket, rest);
      }
      return buildStoragePublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, "portfolio", cleaned);
    }
  }

  return null;
}

function pickNameFromConsultantMetadata(metadata) {
  const m = asObject(metadata);
  if (!m) return null;
  return m.display_name || m.displayName || m.name || m.full_name || m.fullName || null;
}

function toIso(value) {
  return value.toISOString();
}

function atStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateLabel(value, options) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-AU", options).format(new Date(value));
}

function formatMonthDay(value) {
  return formatDateLabel(value, { day: "numeric", month: "short" });
}

function formatMonthDayTime(value) {
  return formatDateLabel(value, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateRange(start, end) {
  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getLocationLabel(item) {
  return item.location_name || [item.suburb, item.state, item.country].filter(Boolean).join(", ") || "Online / TBC";
}

function getWeekSeed(now) {
  return Math.floor(now.getTime() / WEEK_MS);
}

function getConsultantFeatureFallback() {
  return {
    heading: "Consultant feature",
    selectedId: null,
    active: {
      id: null,
      name: "Feature unavailable",
      headline: "No approved public consultants are available yet.",
      location: "",
      logoUrl: null,
      services: [],
      profileUrl: "/consultants",
      profileLabel: "Browse consultants",
      joinedLabel: "",
      caption: "Consultant feature unavailable this week.",
    },
    options: [],
    byId: {},
  };
}

async function getExactCount(sb, table, apply) {
  let query = sb.from(table).select("*", { count: "exact", head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function getUpcomingCalendarData(sb, now) {
  const windowStart = atStartOfDay(now);
  const windowEnd = new Date(windowStart.getTime() + 28 * DAY_MS);

  const [{ data: events = [], error: eventsError }, { data: sessions = [], error: sessionsError }] = await Promise.all([
    sb
      .from("events")
      .select(
        "id,title,summary,starts_at,ends_at,timezone,delivery_method,location_name,suburb,state,country,organizer_name,status"
      )
      .eq("status", "published")
      .gte("starts_at", toIso(windowStart))
      .lt("starts_at", toIso(windowEnd))
      .order("starts_at", { ascending: true }),
    sb
      .from("training_sessions")
      .select(
        `
          id,
          course_id,
          starts_at,
          ends_at,
          timezone,
          delivery_method,
          location_name,
          suburb,
          state,
          country,
          join_url,
          status,
          training_courses!inner (
            id,
            consultant_id,
            title,
            summary,
            status
          )
        `
      )
      .eq("status", "scheduled")
      .eq("training_courses.status", "published")
      .gte("starts_at", toIso(windowStart))
      .lt("starts_at", toIso(windowEnd))
      .order("starts_at", { ascending: true }),
  ]);

  if (eventsError) throw eventsError;
  if (sessionsError) throw sessionsError;

  const upcoming = [];

  for (const event of events) {
    upcoming.push({
      id: `event-${event.id}`,
      type: "event",
      title: event.title,
      summary: event.summary || null,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      delivery_method: event.delivery_method || null,
      location: getLocationLabel(event),
      sourceLabel: event.organizer_name || "Community event",
    });
  }

  const consultantIds = uniq(
    sessions
      .map((session) => session.training_courses?.consultant_id)
      .filter(Boolean)
  );

  let consultantMetaById = new Map();
  if (consultantIds.length) {
    const { data: consultants = [], error: consultantsError } = await sb
      .from("consultants")
      .select("id,metadata")
      .in("id", consultantIds);

    if (consultantsError) throw consultantsError;
    consultantMetaById = new Map(consultants.map((consultant) => [consultant.id, consultant]));
  }

  for (const session of sessions) {
    const course = session.training_courses || {};
    const consultant = consultantMetaById.get(course.consultant_id);
    upcoming.push({
      id: `training-${session.id}`,
      type: "training",
      title: course.title || "Training session",
      summary: course.summary || null,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      delivery_method: session.delivery_method || null,
      location: getLocationLabel(session),
      sourceLabel: pickNameFromConsultantMetadata(consultant?.metadata) || "Training provider",
    });
  }

  upcoming.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const weekBuckets = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(windowStart.getTime() + index * WEEK_MS);
    const end = new Date(start.getTime() + 6 * DAY_MS);
    const count = upcoming.filter((item) => {
      const time = new Date(item.starts_at).getTime();
      return time >= start.getTime() && time < start.getTime() + WEEK_MS;
    }).length;

    return {
      label: formatDateRange(start, end),
      count,
    };
  });

  const items = upcoming.slice(0, 6).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    sourceLabel: item.sourceLabel,
    location: item.location,
    dateLabel: formatMonthDayTime(item.starts_at),
    deliveryMethod: item.delivery_method || null,
  }));

  const trainingCount = upcoming.filter((item) => item.type === "training").length;
  const eventCount = upcoming.filter((item) => item.type === "event").length;

  return {
    heading: "4-week look-ahead",
    windowLabel: formatDateRange(windowStart, new Date(windowEnd.getTime() - DAY_MS)),
    totalCount: upcoming.length,
    trainingCount,
    eventCount,
    items,
    weekBuckets,
    caption: [
      `Four-week look-ahead: ${upcoming.length} upcoming items are live on YouMine.`,
      `${trainingCount} training sessions and ${eventCount} events are currently scheduled.`,
      "See the full calendar on youmine.io/whats-on.",
    ].join("\n"),
  };
}

async function getConsultantFeatureData(sb, now) {
  const { data: consultants = [], error } = await sb
    .from("consultants")
    .select("id,slug,display_name,headline,location,metadata,created_at")
    .eq("visibility", "public")
    .eq("status", "approved");

  if (error) throw error;

  const ordered = consultants
    .slice()
    .sort((a, b) => {
      const createdDelta = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (createdDelta !== 0) return createdDelta;
      return String(a.id).localeCompare(String(b.id));
    });

  const featured = ordered.length ? ordered[getWeekSeed(now) % ordered.length] : null;
  if (!featured) {
    return getConsultantFeatureFallback();
  }

  const consultantIds = ordered.map((consultant) => consultant.id);
  const { data: serviceLinks = [], error: servicesError } = await sb
    .from("consultant_services")
    .select("consultant_id, services(name)")
    .in("consultant_id", consultantIds);

  if (servicesError) throw servicesError;

  const servicesByConsultantId = {};
  for (const link of serviceLinks) {
    const consultantId = link.consultant_id;
    const serviceName = link.services?.name;
    if (!consultantId || !serviceName) continue;
    if (!servicesByConsultantId[consultantId]) servicesByConsultantId[consultantId] = [];
    servicesByConsultantId[consultantId].push(serviceName);
  }

  const byId = {};
  const options = ordered.map((consultant) => {
    const name = consultant.display_name || pickNameFromConsultantMetadata(consultant.metadata) || "Featured consultant";
    const consultantFeature = {
      id: consultant.id,
      name,
      headline: consultant.headline || "Mining expertise available through YouMine.",
      location: consultant.location || "Australia / remote",
      logoUrl: pickLogoFromConsultantMetadata(consultant.metadata),
      services: uniq(servicesByConsultantId[consultant.id] || []).slice(0, 4),
      profileUrl: `/consultants/${consultant.slug || consultant.id}`,
      profileLabel: "View profile",
      joinedLabel: consultant.created_at
        ? `On YouMine since ${formatDateLabel(consultant.created_at, { month: "long", year: "numeric" })}`
        : "Approved consultant",
      caption: [
        `${name} is this week's featured consultant on YouMine.`,
        consultant.headline || "Explore their profile and current capabilities.",
        `View profile: youmine.io/consultants/${consultant.slug || consultant.id}`,
      ].join("\n"),
    };

    byId[consultant.id] = consultantFeature;
    return {
      id: consultant.id,
      name,
      location: consultantFeature.location,
    };
  });

  return {
    heading: "Consultant feature",
    selectedId: featured.id,
    active: byId[featured.id],
    options,
    byId,
  };
}

async function getJobsSnapshotData(sb, now) {
  const recentWindowStart = new Date(now.getTime() - 7 * DAY_MS);

  const [
    { data: jobs = [], error: jobsError },
    openCount,
    recentCount,
  ] = await Promise.all([
    sb
      .from("jobs")
      .select("id,title,company,location,created_at,service:services(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    getExactCount(sb, "jobs", (query) => query.eq("status", "open")),
    getExactCount(sb, "jobs", (query) => query.gte("created_at", toIso(recentWindowStart))),
  ]);

  if (jobsError) throw jobsError;

  return {
    heading: "Jobs posted",
    openCount,
    recentCount,
    windowLabel: `Posted in the last 7 days ending ${formatMonthDay(now)}`,
    items: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company || "Confidential client",
      location: job.location || "Location flexible",
      service: job.service?.name || "General mining support",
      dateLabel: job.created_at ? formatMonthDay(job.created_at) : "Recent",
    })),
    caption: [
      `${recentCount} jobs were posted on YouMine in the last 7 days.`,
      `${openCount} opportunities are currently open on the board.`,
      "Browse live roles on youmine.io/jobs.",
    ].join("\n"),
  };
}

async function getSiteAnalyticsData(sb, whatsOn) {
  const [consultants, users, pageViews, contacts, openJobs] = await Promise.all([
    getExactCount(sb, "consultants", (query) => query.eq("visibility", "public").eq("status", "approved")),
    getExactCount(sb, "user_profiles"),
    getExactCount(sb, "consultant_page_views"),
    getExactCount(sb, "consultant_contacts"),
    getExactCount(sb, "jobs", (query) => query.eq("status", "open")),
  ]);

  return {
    heading: "Site analytics",
    metrics: [
      { label: "Approved consultants", value: consultants },
      { label: "Registered users", value: users },
      { label: "Consultant page views", value: pageViews },
      { label: "Consultant enquiries", value: contacts },
    ],
    supporting: [
      { label: "Open jobs", value: openJobs },
      { label: "Upcoming in 4 weeks", value: whatsOn.totalCount || 0 },
      { label: "Training sessions", value: whatsOn.trainingCount || 0 },
      { label: "Events", value: whatsOn.eventCount || 0 },
    ],
    caption: [
      `YouMine currently features ${consultants} approved consultants and ${users} registered users.`,
      `${pageViews} consultant page views and ${contacts} enquiries have been logged so far.`,
      `${openJobs} jobs are open, with ${whatsOn.totalCount || 0} upcoming calendar items over the next four weeks.`,
    ].join("\n"),
  };
}

function getFallbackWhatsOn(now) {
  return {
    heading: "4-week look-ahead",
    windowLabel: formatDateRange(atStartOfDay(now), new Date(atStartOfDay(now).getTime() + 27 * DAY_MS)),
    totalCount: 0,
    trainingCount: 0,
    eventCount: 0,
    items: [],
    weekBuckets: Array.from({ length: 4 }, (_, index) => {
      const start = new Date(atStartOfDay(now).getTime() + index * WEEK_MS);
      return { label: formatDateRange(start, new Date(start.getTime() + 6 * DAY_MS)), count: 0 };
    }),
    caption: "No upcoming events or training sessions were available when this post was generated.",
  };
}

export async function getSocialStudioData(sb) {
  const now = new Date();
  const warnings = [];

  let whatsOn = getFallbackWhatsOn(now);
  try {
    whatsOn = await getUpcomingCalendarData(sb, now);
  } catch (error) {
    warnings.push(`What's On feed unavailable: ${error.message}`);
  }

  const [consultantFeatureResult, jobsResult, analyticsResult] = await Promise.allSettled([
    getConsultantFeatureData(sb, now),
    getJobsSnapshotData(sb, now),
    getSiteAnalyticsData(sb, whatsOn),
  ]);

  const consultantFeature = consultantFeatureResult.status === "fulfilled"
    ? consultantFeatureResult.value
    : {
        ...getConsultantFeatureFallback(),
        active: {
          ...getConsultantFeatureFallback().active,
          headline: "Consultant data could not be loaded.",
          caption: "Consultant feature data could not be loaded.",
        },
      };

  if (consultantFeatureResult.status === "rejected") {
    warnings.push(`Consultant feature unavailable: ${consultantFeatureResult.reason?.message || "Unknown error"}`);
  }

  const jobs = jobsResult.status === "fulfilled"
    ? jobsResult.value
    : {
        heading: "Jobs posted",
        openCount: 0,
        recentCount: 0,
        windowLabel: `Posted in the last 7 days ending ${formatMonthDay(now)}`,
        items: [],
        caption: "Jobs data could not be loaded.",
      };

  if (jobsResult.status === "rejected") {
    warnings.push(`Jobs snapshot unavailable: ${jobsResult.reason?.message || "Unknown error"}`);
  }

  const analytics = analyticsResult.status === "fulfilled"
    ? analyticsResult.value
    : {
        heading: "Site analytics",
        metrics: [],
        supporting: [],
        caption: "Analytics data could not be loaded.",
      };

  if (analyticsResult.status === "rejected") {
    warnings.push(`Analytics snapshot unavailable: ${analyticsResult.reason?.message || "Unknown error"}`);
  }

  return {
    generatedAt: now.toISOString(),
    warnings,
    whatsOn,
    consultantFeature,
    jobs,
    analytics,
  };
}