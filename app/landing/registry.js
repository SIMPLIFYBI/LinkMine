// Central registry that imports per-page content and validates entries.
import { validateEntry } from "./content/types";

import geotech from "./content/geotechnical-consultants-wa";
import mineEngPlan from "./content/mine-engineering-planning-consultants-australia";

const entries = [geotech, mineEngPlan].map(validateEntry);

export const landingPages = entries;
export function getLandingEntry(slug) {
  return entries.find((e) => e.slug === slug) || null;
}