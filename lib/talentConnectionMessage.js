const CONTACT_DETAIL_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:https?:\/\/|www\.)\S+/i,
  /\b(?:linkedin|whatsapp|telegram|signal|wechat|instagram|facebook|discord)\b/i,
  /(?:\+?\d[\s().-]*){8,}\d/,
  /\B@[a-z0-9_]{3,}\b/i,
];

export function initialConnectionMessageHasContactDetails(value) {
  const message = String(value || "");
  return CONTACT_DETAIL_PATTERNS.some((pattern) => pattern.test(message));
}

export const INITIAL_CONNECTION_CONTACT_DETAILS_MESSAGE = "Remove email addresses, phone numbers, links, and social handles from this request. You can share contact details after the candidate accepts.";