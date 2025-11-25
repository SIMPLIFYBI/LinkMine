import { validateEntry } from "./content/types";

import geotech from "./content/geotechnical-consultants-wa";
import mineEngPlan from "./content/mine-engineering-planning-consultants-australia";
import openPit from "./content/open-pit-engineering-consultants-australia";
import miningPerth from "./content/mining-consultants-perth-western-australia";
import miningQld from "./content/mining-consultants-brisbane-queensland";
import environmentalServices from "./content/environmental-services-mining-australia";
import miningSafetyAustralia from "./content/mining-safety-consultants-australia"; // NEW

const entries = [
  geotech,
  mineEngPlan,
  openPit,
  miningPerth,
  miningQld,
  environmentalServices,
  miningSafetyAustralia, // NEW
].map(validateEntry);

export const landingPages = entries;
export function getLandingEntry(slug) {
  return entries.find((e) => e.slug === slug) || null;
}