export const USER_TYPE_OPTIONS = [
  {
    value: "consultant",
    label: "Consultant / Service provider",
    helpText:
      "You offer technical or field services to clients and can be discovered in the consultancy directory.",
  },
  {
    value: "client",
    label: "Client",
    helpText:
      "You are hiring consultants or creators and using the platform to find capability and resources.",
  },
  {
    value: "digital_creator",
    label: "Digital product creator",
    helpText:
      "You create reusable digital products such as templates, guides, tools, or data resources.",
  },
];

const VALUE_TO_LABEL = new Map(USER_TYPE_OPTIONS.map((option) => [option.value, option.label]));

const STORED_VALUES = new Set([
  "unspecified",
  "consultant",
  "client",
  "digital_creator",
  "both",
  "consultant_client",
  "consultant_digital_creator",
  "client_digital_creator",
  "consultant_client_digital_creator",
]);

export function isValidStoredUserType(value) {
  return STORED_VALUES.has(String(value || ""));
}

export function decodeStoredUserTypes(storedValue) {
  const value = String(storedValue || "");

  switch (value) {
    case "consultant":
      return ["consultant"];
    case "client":
      return ["client"];
    case "digital_creator":
      return ["digital_creator"];
    case "both":
    case "consultant_client":
      return ["consultant", "client"];
    case "consultant_digital_creator":
      return ["consultant", "digital_creator"];
    case "client_digital_creator":
      return ["client", "digital_creator"];
    case "consultant_client_digital_creator":
      return ["consultant", "client", "digital_creator"];
    default:
      return [];
  }
}

export function encodeSelectedUserTypes(selectedValues) {
  const unique = Array.from(
    new Set((selectedValues || []).filter((value) => VALUE_TO_LABEL.has(value)))
  );

  const hasConsultant = unique.includes("consultant");
  const hasClient = unique.includes("client");
  const hasCreator = unique.includes("digital_creator");

  if (hasConsultant && hasClient && hasCreator) {
    return "consultant_client_digital_creator";
  }

  if (hasConsultant && hasClient) {
    return "consultant_client";
  }

  if (hasConsultant && hasCreator) {
    return "consultant_digital_creator";
  }

  if (hasClient && hasCreator) {
    return "client_digital_creator";
  }

  if (hasConsultant) {
    return "consultant";
  }

  if (hasClient) {
    return "client";
  }

  if (hasCreator) {
    return "digital_creator";
  }

  return "unspecified";
}

export function formatSelectedUserTypes(selectedValues) {
  const labels = (selectedValues || [])
    .filter((value) => VALUE_TO_LABEL.has(value))
    .map((value) => VALUE_TO_LABEL.get(value));

  return labels.length ? labels.join(", ") : "Not set";
}
