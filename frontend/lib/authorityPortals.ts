/**
 * Resolve official authority portal URLs for compliance requirements and statutory evidence.
 * Prevents falling back to generic placeholder domains like egazette.gov.in when specific
 * state or central regulatory authority portals exist.
 */
export function resolveAuthorityPortalUrl(
  authority?: string,
  titleOrDesc?: string,
  explicitUrl?: string
): string {
  // If a specific, valid URL is provided (and not egazette), prefer it
  if (
    explicitUrl &&
    explicitUrl.trim() !== "" &&
    !explicitUrl.includes("egazette.gov.in")
  ) {
    return explicitUrl;
  }

  const authLower = (authority || "").toLowerCase();
  const descLower = (titleOrDesc || "").toLowerCase();

  // 1. West Bengal Environmental & Factory Authorities
  if (
    authLower.includes("wbpcb") ||
    (authLower.includes("west bengal") && (authLower.includes("pollution") || descLower.includes("cte") || descLower.includes("cto") || descLower.includes("consent to establish")))
  ) {
    return "https://wbpcb.gov.in";
  }

  if (
    authLower.includes("directorate of factories") ||
    (authLower.includes("west bengal") && (descLower.includes("factory") || descLower.includes("labour")))
  ) {
    return "https://wbfactories.gov.in";
  }

  // 2. Maharashtra State Authorities
  if (
    authLower.includes("mpcb") ||
    (authLower.includes("maharashtra") && authLower.includes("pollution"))
  ) {
    return "https://ecmpcb.in";
  }

  if (
    authLower.includes("dish") ||
    (authLower.includes("maharashtra") && descLower.includes("factory"))
  ) {
    return "https://mahakamgar.gov.in";
  }

  // 3. E-Waste & Extended Producer Responsibility (CPCB)
  if (
    descLower.includes("e-waste") ||
    descLower.includes("epr") ||
    authLower.includes("cpcb_ewaste") ||
    descLower.includes("extended producer responsibility")
  ) {
    return "https://eprewastecpcb.in";
  }

  // 4. Central Pollution Control Board
  if (
    authLower.includes("cpcb") ||
    authLower.includes("central pollution")
  ) {
    return "https://cpcb.nic.in";
  }

  // 5. Bureau of Indian Standards (BIS) & Technical Standards
  if (
    authLower.includes("bis") ||
    authLower.includes("bureau of indian standards") ||
    descLower.includes("is 17017") ||
    descLower.includes("is 13252") ||
    descLower.includes("is 269") ||
    descLower.includes("crs") ||
    descLower.includes("technical standard")
  ) {
    return "https://bis.gov.in";
  }

  // 6. Foreign Trade & DGFT
  if (
    authLower.includes("dgft") ||
    authLower.includes("foreign trade") ||
    descLower.includes("iec") ||
    descLower.includes("importer-exporter") ||
    descLower.includes("import export")
  ) {
    return "https://dgft.gov.in";
  }

  // 7. Food Safety & Standards (FSSAI)
  if (
    authLower.includes("fssai") ||
    descLower.includes("fssai") ||
    descLower.includes("foscos") ||
    descLower.includes("food safety")
  ) {
    return "https://foscos.fssai.gov.in";
  }

  // 8. General Labour / Factory Safety
  if (descLower.includes("factory") || descLower.includes("labour")) {
    return "https://shramsuvidha.gov.in";
  }

  // Generic fallback if authority has its own URL, else national portal
  if (explicitUrl && explicitUrl.trim() !== "") {
    return explicitUrl;
  }

  return "https://india.gov.in";
}
