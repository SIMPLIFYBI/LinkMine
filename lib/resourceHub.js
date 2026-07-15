export const RESOURCE_TYPES = ["hosted", "external"];

export const RESOURCE_STATUSES = ["draft", "pending", "approved", "rejected", "archived"];

export const RESOURCE_REQUEST_STATUSES = ["open", "claimed", "completed", "cancelled"];

export const RESOURCE_ENTITLEMENT_SOURCES = [
  "free",
  "purchase",
  "request_fulfilment",
  "admin",
  "owner",
];

export const RESOURCE_ORDER_STATUSES = [
  "draft",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
];

export const RESOURCE_ORDER_ITEM_STATUSES = [
  "pending",
  "paid",
  "cancelled",
  "refunded",
];

export const RESOURCE_PAYMENT_ATTEMPT_STATUSES = [
  "created",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
];

export const RESOURCE_PAYOUT_ACCOUNT_STATUSES = [
  "pending",
  "active",
  "restricted",
  "disabled",
];

export const RESOURCE_PAYOUT_LEDGER_ENTRY_TYPES = [
  "earning",
  "refund",
  "adjustment",
  "payout",
];

export const RESOURCE_PAYOUT_LEDGER_STATUSES = [
  "pending",
  "available",
  "paid",
  "reversed",
];

export const RESOURCE_ACCESS_KINDS = ["hosted", "external"];

export const RESOURCE_LAUNCH_LIMITS = {
  maxActiveResources: 10,
  maxPackBytes: 25 * 1024 * 1024,
  maxStorageBytes: 250 * 1024 * 1024,
  maxDownloadsPerDay: 15,
  maxDownloadBytesPerDay: 500 * 1024 * 1024,
};

export const RESOURCE_CATEGORY_SEEDS = [
  { slug: "hse", name: "HSE" },
  { slug: "mine_planning", name: "Mine Planning" },
  { slug: "geology", name: "Geology" },
  { slug: "gis_spatial", name: "GIS & Spatial" },
  { slug: "drill_blast", name: "Drill & Blast" },
  { slug: "processing", name: "Processing" },
  { slug: "maintenance", name: "Maintenance" },
  { slug: "training", name: "Training" },
  { slug: "templates", name: "Templates" },
  { slug: "scripts_automation", name: "Scripts & Automation" },
];

export function isValidResourceType(value) {
  return RESOURCE_TYPES.includes(value);
}

export function isValidResourceStatus(value) {
  return RESOURCE_STATUSES.includes(value);
}

export function isValidResourceRequestStatus(value) {
  return RESOURCE_REQUEST_STATUSES.includes(value);
}

export function isValidResourceOrderStatus(value) {
  return RESOURCE_ORDER_STATUSES.includes(value);
}

export function isValidResourceOrderItemStatus(value) {
  return RESOURCE_ORDER_ITEM_STATUSES.includes(value);
}

export function isValidResourcePaymentAttemptStatus(value) {
  return RESOURCE_PAYMENT_ATTEMPT_STATUSES.includes(value);
}

export function isValidResourcePayoutAccountStatus(value) {
  return RESOURCE_PAYOUT_ACCOUNT_STATUSES.includes(value);
}

export function isValidResourcePayoutLedgerEntryType(value) {
  return RESOURCE_PAYOUT_LEDGER_ENTRY_TYPES.includes(value);
}

export function isValidResourcePayoutLedgerStatus(value) {
  return RESOURCE_PAYOUT_LEDGER_STATUSES.includes(value);
}

export function isHostedResource(value) {
  return value === "hosted";
}

export function isExternalResource(value) {
  return value === "external";
}

export function formatResourceBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}
