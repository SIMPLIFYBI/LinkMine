import test from "node:test";
import assert from "node:assert/strict";
import { parseSearchConsoleParams } from "../lib/searchConsoleParams.mjs";

const now = new Date("2026-11-18T02:00:00Z");

test("presets use Pacific dates and an equal preceding period", () => {
  assert.deepEqual(parseSearchConsoleParams(new URLSearchParams("days=7"), now), {
    start: "2026-11-08", end: "2026-11-14", previousStart: "2026-11-01", previousEnd: "2026-11-07", filters: {},
  });
});

test("custom ranges include both days and normalize filters", () => {
  const params = new URLSearchParams({ start: "2026-02-27", end: "2026-03-01", country: "aus", device: "MOBILE", query: " mine " });
  assert.deepEqual(parseSearchConsoleParams(params, now), {
    start: "2026-02-27", end: "2026-03-01", previousStart: "2026-02-24", previousEnd: "2026-02-26", filters: { query: "mine", country: "AUS", device: "MOBILE" },
  });
});

test("rejects invalid dates, future dates, long ranges and bad filters", () => {
  for (const query of ["start=2026-02-30&end=2026-03-01", "start=2026-04-02&end=2026-04-01", "start=2025-01-01&end=2026-01-01", "start=2026-11-18&end=2026-11-18", "days=8", "country=AU", "device=PHONE"]) {
    assert.throws(() => parseSearchConsoleParams(new URLSearchParams(query), now), { code: "INVALID_INPUT" });
  }
});