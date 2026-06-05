const HARD_BLOCKED_EMAILS = [
  "info@romfordfinanceltd.com",
];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getConfiguredBlockedEmails() {
  return [
    ...String(process.env.BLOCKED_EMAILS || "").split(","),
    ...String(process.env.NEXT_PUBLIC_BLOCKED_EMAILS || "").split(","),
  ]
    .map(normalizeEmail)
    .filter(Boolean);
}

export function getBlockedEmails() {
  return Array.from(new Set([...HARD_BLOCKED_EMAILS, ...getConfiguredBlockedEmails()].map(normalizeEmail).filter(Boolean)));
}

export function isBlockedEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getBlockedEmails().includes(normalized);
}

export function getBlockedUserMessage() {
  return "This account is blocked from using YouMine.";
}