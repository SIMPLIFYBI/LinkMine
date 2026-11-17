const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const swc = require("next/dist/build/swc");

function loadReporting(request) {
  const code = swc.transformSync(fs.readFileSync("lib/searchConsoleReporting.js", "utf8"), { jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" } }).code;
  const exports = {};
  const context = {
    exports,
    process: { env: {} },
    console,
    setTimeout: (callback) => callback(),
    require(name) {
      if (name === "server-only") return {};
      if (name === "@/lib/googleServiceAccount") return { getGoogleServiceAccount: () => ({ clientEmail: "service@example.com", projectId: "project", privateKey: "test-key" }) };
      if (name === "google-auth-library") return { GoogleAuth: class { async getClient() { return { request }; } } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(code, context);
  return exports;
}

const options = { start: "2026-10-01", end: "2026-10-07", previousStart: "2026-09-24", previousEnd: "2026-09-30", filters: { country: "AUS" } };

test("requests each report with filters and caches results", async () => {
  const calls = [];
  const reporting = loadReporting(async (request) => { calls.push(request); return { data: { rows: [{ clicks: 4, impressions: 100, ctr: 0.04, position: 8 }], responseAggregationType: "byProperty" } }; });
  const report = await reporting.getSearchConsoleReport(options);
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.url.includes("sc-domain%3Ayoumine.io")));
  assert.ok(calls.every((call) => call.data.dimensionFilterGroups[0].filters[0].expression === "AUS"));
  assert.equal(calls[6].data.startDate, "2026-09-24");
  assert.equal(report.previousOverview.clicks, 4);
  await reporting.getSearchConsoleReport(options);
  assert.equal(calls.length, 7);
  await reporting.getSearchConsoleReport(options, true);
  assert.equal(calls.length, 14);
});

test("retries and reports quota failures without caching them", async () => {
  let count = 0;
  const reporting = loadReporting(async () => { count += 1; throw { response: { status: 403, data: { error: { errors: [{ reason: "rateLimitExceeded" }] } } } }; });
  await assert.rejects(reporting.getSearchConsoleReport(options), { code: "GSC_RATE_LIMIT" });
  assert.equal(count, 21);
  await assert.rejects(reporting.getSearchConsoleReport(options), { code: "GSC_RATE_LIMIT" });
  assert.equal(count, 42);
});