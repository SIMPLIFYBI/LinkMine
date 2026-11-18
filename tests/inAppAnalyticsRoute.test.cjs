const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const swc = require("next/dist/build/swc");

function loadRoute(admin, rpcResult = { data: { overview: {} }, error: null }, hasServiceKey = true) {
  const code = swc.transformSync(fs.readFileSync("app/api/admin/analytics/in-app/route.js", "utf8"), {
    jsc: { parser: { syntax: "ecmascript" }, target: "es2022" },
    module: { type: "commonjs" },
  }).code;
  const exports = {};
  const calls = [];
  vm.runInNewContext(code, { exports, URL, console: { error() {} }, require(name) {
    if (name === "next/server") return { NextResponse: { json: (body, options = {}) => ({ body, ...options }) } };
    if (name === "@/lib/adminAnalyticsAuth") return { getAnalyticsAdminContext: async () => admin };
    if (name === "@/lib/supabaseAdminClient") return { supabaseAdminClient: () => ({ rpc: async (...args) => { calls.push(args); return rpcResult; } }) };
    if (name === "@/lib/supabaseEnv") return { getSupabaseServiceRoleKey: () => hasServiceKey ? "configured" : "" };
    if (name === "@/lib/supabaseServerClient") return { supabaseServerClient: async () => ({ rpc: async (...args) => { calls.push(args); return rpcResult; } }) };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return { get: exports.GET, calls };
}

test("rejects unauthorized users before accessing the database", async () => {
  const route = loadRoute({ ok: false, status: 403, error: "Forbidden." });
  const result = await route.get({ url: "https://example.com/api?days=30" });
  assert.equal(result.status, 403);
  assert.equal(route.calls.length, 0);
});

test("validates periods and requests the selected aggregate", async () => {
  const route = loadRoute({ ok: true });
  assert.equal((await route.get({ url: "https://example.com/api?days=365" })).status, 400);
  const result = await route.get({ url: "https://example.com/api?days=90" });
  assert.equal(result.body.ok, true);
  assert.equal(result.headers["Cache-Control"], "private, no-store");
  assert.equal(route.calls[0][0], "admin_in_app_analytics");
  assert.equal(route.calls[0][1].p_days, 90);
});

test("does not expose database failures", async () => {
  const route = loadRoute({ ok: true }, { data: null, error: { message: "private database details" } });
  const result = await route.get({ url: "https://example.com/api" });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, "In-app reporting is temporarily unavailable.");
});

test("uses the authenticated admin RPC when no service role key is configured", async () => {
  const route = loadRoute({ ok: true }, { data: { overview: {} }, error: null }, false);
  const result = await route.get({ url: "https://example.com/api?days=7" });
  assert.equal(result.body.ok, true);
  assert.equal(route.calls[0][0], "admin_in_app_analytics_for_admin");
  assert.equal(route.calls[0][1].p_days, 7);
});

test("explains when an email-allowlisted user is not a database admin", async () => {
  const route = loadRoute({ ok: true }, { data: null, error: { code: "42501" } }, false);
  const result = await route.get({ url: "https://example.com/api" });
  assert.equal(result.status, 403);
  assert.match(result.body.error, /app_admins/);
});