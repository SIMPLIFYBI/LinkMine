const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const swc = require("next/dist/build/swc");

function loadAuth(user, adminRow, emails = "") {
  const code = swc.transformSync(fs.readFileSync("lib/adminAnalyticsAuth.js", "utf8"), { jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" } }).code;
  const exports = {};
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: adminRow }) }) }) }),
  };
  vm.runInNewContext(code, { exports, process: { env: { NEXT_PUBLIC_ADMIN_EMAILS: emails } }, require(name) {
    if (name === "server-only") return {};
    if (name === "@/lib/supabaseServerClient") return { supabaseServerClient: async () => client };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return exports.getAnalyticsAdminContext();
}

test("rejects anonymous and non-admin users", async () => {
  assert.equal((await loadAuth(null, null)).status, 401);
  assert.equal((await loadAuth({ id: "user", email: "user@example.com" }, null)).status, 403);
});

test("allows registered and email-allowlisted admins", async () => {
  assert.equal((await loadAuth({ id: "admin" }, { user_id: "admin" })).ok, true);
  assert.equal((await loadAuth({ id: "user", email: "Admin@Example.com" }, null, "admin@example.com")).ok, true);
});