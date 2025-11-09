// Utilities to derive a short claim code from a UUID token without extra DB column.
export function shortClaimCodeFromToken(uuid) {
  if (!uuid || typeof uuid !== "string") return "";
  const raw = uuid.replace(/-/g, "").toUpperCase(); // 32 hex
  // 12-char code derived from token (readable groups of 4)
  const base = raw.slice(0, 10) + raw.slice(-2);
  return `${base.slice(0,4)}-${base.slice(4,8)}-${base.slice(8,12)}`;
}

export function normalizeClaimCodeInput(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12); // we expect 12 chars
}

export function tokenMatchesCode(token, userCode) {
  const expected = shortClaimCodeFromToken(token).replace(/-/g, "");
  const provided = normalizeClaimCodeInput(userCode);
  return expected === provided;
}