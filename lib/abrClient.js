import "server-only";
import { XMLParser } from "fast-xml-parser";
import { getABRConfig } from "@/lib/serverEnv";

// Generic fetch with timeout
async function postSoap(xml, soapAction) {
  const { ENDPOINT, TIMEOUT_MS } = getABRConfig();
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: soapAction,
      },
      body: xml,
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ABR ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function buildEnvelope(body) {
  return `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      ${body}
    </soap:Body>
  </soap:Envelope>`;
}

function bodyForABN(abn) {
  const { GUID } = getABRConfig();
  return `
    <SearchByABNv202001 xmlns="http://abr.business.gov.au/ABRXMLSearch/">
      <searchString>${abn}</searchString>
      <includeHistoricalDetails>N</includeHistoricalDetails>
      <authenticationGuid>${GUID}</authenticationGuid>
    </SearchByABNv202001>`;
}

function bodyForASIC(acn) {
  const { GUID } = getABRConfig();
  return `
    <SearchByASICv201408 xmlns="http://abr.business.gov.au/ABRXMLSearch/">
      <searchString>${acn}</searchString>
      <authenticationGuid>${GUID}</authenticationGuid>
    </SearchByASICv201408>`;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: false,
});

// Utility: recursively find first node whose key ends with suffix (namespace-safe)
function findNodeBySuffix(obj, suffix) {
  if (!obj || typeof obj !== "object") return null;
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase().endsWith(suffix.toLowerCase())) return v;
    if (v && typeof v === "object") {
      const child = findNodeBySuffix(v, suffix);
      if (child) return child;
    }
  }
  return null;
}

// Normalize common fields from ABR response structure
function normalizeEntry(xmlText) {
  const root = parser.parse(xmlText);

  const abnListEntry = findNodeBySuffix(root, "ABNListEntry");
  const asicNumberNode = findNodeBySuffix(root, "ASICNumber");

  const abnNode = abnListEntry?.ABN || abnListEntry?.Abn || findNodeBySuffix(root, "ABN");
  const abnDigits = String(
    typeof abnNode === "string" ? abnNode : (abnNode?.identifierValue || abnNode?.Abn || abnNode?.value || "")
  ).replace(/\D/g, "");

  let entityName =
    abnListEntry?.mainName?.organisationName ||
    abnListEntry?.legalName?.fullName ||
    [abnListEntry?.legalName?.givenName, abnListEntry?.legalName?.familyName].filter(Boolean).join(" ") ||
    abnListEntry?.mainTradingName?.organisationName ||
    findNodeBySuffix(root, "organisationName") ||
    null;

  if (Array.isArray(entityName)) entityName = entityName[0];

  const entityTypeDesc =
    abnListEntry?.entityType?.entityDescription ||
    abnListEntry?.entityType?.EntityDescription ||
    findNodeBySuffix(root, "entityDescription") ||
    findNodeBySuffix(root, "entityTypeInd") ||
    null;

  const status =
    abnListEntry?.entityStatus?.entityStatusCode ||
    abnListEntry?.entityStatus?.EntityStatusCode ||
    findNodeBySuffix(root, "entityStatusCode") ||
    findNodeBySuffix(root, "entityStatus") ||
    null;

  const gstFrom =
    abnListEntry?.goodsAndServicesTax?.effectiveFrom ||
    findNodeBySuffix(root, "effectiveFrom") ||
    null;

  const acn = String(asicNumberNode || "").replace(/\D/g, "") || null;

  return {
    abn: abnDigits || null,
    acn,
    entityName: entityName || null,
    entityType: entityTypeDesc || null,
    status: status || null,
    gstRegisteredFrom: gstFrom || null,
    raw: root,
  };
}

export async function searchByABN(abn) {
  const { GUID } = getABRConfig();
  if (!GUID) throw new Error("ABR GUID missing");
  const xml = buildEnvelope(bodyForABN(abn));
  const soapAction = "http://abr.business.gov.au/ABRXMLSearch/SearchByABNv202001";
  const res = await postSoap(xml, soapAction);
  return normalizeEntry(res);
}

export async function searchByASIC(acn) {
  const { GUID } = getABRConfig();
  if (!GUID) throw new Error("ABR GUID missing");
  const xml = buildEnvelope(bodyForASIC(acn));
  const soapAction = "http://abr.business.gov.au/ABRXMLSearch/SearchByASICv201408";
  const res = await postSoap(xml, soapAction);
  return normalizeEntry(res);
}