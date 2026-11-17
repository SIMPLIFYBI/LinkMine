const DAY_MS = 86400000;

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

export function parseSearchConsoleParams(params, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  const today = parseDate(`${part("year")}-${part("month")}-${part("day")}`);
  let end = parseDate(params.get("end"));
  let start = parseDate(params.get("start"));
  if (params.has("start") || params.has("end")) {
    if (!start || !end) throw Object.assign(new Error("Enter a valid start and end date."), { code: "INVALID_INPUT" });
  } else {
    const days = Number(params.get("days") || 30);
    if (![7, 30, 90].includes(days)) throw Object.assign(new Error("Invalid reporting period."), { code: "INVALID_INPUT" });
    end = new Date(today.getTime() - 3 * DAY_MS);
    start = new Date(end.getTime() - (days - 1) * DAY_MS);
  }
  const days = (end - start) / DAY_MS + 1;
  if (days < 1 || days > 365 || end > today) throw Object.assign(new Error("Choose a date range of up to 365 days that does not end in the future."), { code: "INVALID_INPUT" });
  const filters = {};
  for (const dimension of ["query", "page", "country", "device"]) {
    const value = String(params.get(dimension) || "").trim();
    if (value.length > 500) throw Object.assign(new Error("Filter is too long."), { code: "INVALID_INPUT" });
    if (value) filters[dimension] = value;
  }
  if (filters.country && !/^[a-z]{3}$/i.test(filters.country)) throw Object.assign(new Error("Country must be a three-letter country code."), { code: "INVALID_INPUT" });
  if (filters.device && !["DESKTOP", "MOBILE", "TABLET"].includes(filters.device)) throw Object.assign(new Error("Invalid device."), { code: "INVALID_INPUT" });
  if (filters.country) filters.country = filters.country.toUpperCase();
  return { start: dateString(start), end: dateString(end), previousStart: dateString(new Date(start.getTime() - days * DAY_MS)), previousEnd: dateString(new Date(start.getTime() - DAY_MS)), filters };
}