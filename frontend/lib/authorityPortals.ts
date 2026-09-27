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
  // If a specific, valid deep URL is provided (and not egazette or root placeholders), prefer it
  if (
    explicitUrl &&
    explicitUrl.trim() !== "" &&
    !explicitUrl.includes("egazette.gov.in") &&
    explicitUrl !== "https://dgft.gov.in" &&
    explicitUrl !== "https://dgft.gov.in/" &&
    explicitUrl !== "https://india.gov.in" &&
    explicitUrl !== "https://india.gov.in/" &&
    explicitUrl !== "https://www.nsws.gov.in" &&
    explicitUrl !== "https://www.nsws.gov.in/"
  ) {
    return explicitUrl;
  }

  const authLower = (authority || "").toLowerCase();
  const descLower = (titleOrDesc || "").toLowerCase();

  // 1. Cybersecurity & CERT-In Directives
  if (
    authLower.includes("cert") ||
    descLower.includes("cert-in") ||
    descLower.includes("certin") ||
    descLower.includes("cybersecurity") ||
    descLower.includes("cyber security") ||
    descLower.includes("incident reporting") ||
    descLower.includes("log retention")
  ) {
    return "https://www.cert-in.org.in/directions2022.htm";
  }

  // 2. Digital Personal Data Protection (DPDP Act 2023)
  if (
    descLower.includes("dpdp") ||
    descLower.includes("data protection") ||
    descLower.includes("data privacy") ||
    descLower.includes("data fiduciary") ||
    descLower.includes("digital personal data")
  ) {
    return "https://www.meity.gov.in/content/digital-personal-data-protection-act-2023";
  }

  // 3. POSH / Prevention of Sexual Harassment at Workplace
  if (
    descLower.includes("posh") ||
    descLower.includes("sexual harassment") ||
    descLower.includes("internal committee") ||
    descLower.includes("internal complaints committee")
  ) {
    return "https://wcd.nic.in/act/handbook-sexual-harassment-women-workplace";
  }

  // 4. Foreign Trade & DGFT IEC (Direct Service Link)
  if (
    authLower.includes("dgft") ||
    authLower.includes("foreign trade") ||
    descLower.includes("iec") ||
    descLower.includes("importer-exporter") ||
    descLower.includes("import export") ||
    descLower.includes("foreign trade policy")
  ) {
    return "https://www.dgft.gov.in/CP/?opt=iec-service";
  }

  // 5. Startup & Tech Schemes
  if (
    descLower.includes("seed fund") ||
    descLower.includes("sisfs") ||
    descLower.includes("startup india")
  ) {
    return "https://seedfund.startupindia.gov.in/";
  }

  if (
    descLower.includes("ipr") ||
    descLower.includes("intellectual property") ||
    descLower.includes("patent") ||
    descLower.includes("trademark")
  ) {
    return "https://innovative.msme.gov.in/Home/Ipr";
  }

  if (
    descLower.includes("cgtmse") ||
    descLower.includes("credit guarantee") ||
    descLower.includes("collateral-free")
  ) {
    return "https://www.cgtmse.in/Default/ViewPage/?id=1&name=AboutUs";
  }

  if (
    descLower.includes("samadhaan") ||
    descLower.includes("delayed payment") ||
    descLower.includes("msefc")
  ) {
    return "https://samadhaan.msme.gov.in/MyMsme/MSEFC/MSEFC_Welcome.aspx";
  }

  if (
    descLower.includes("treds") ||
    descLower.includes("rxil") ||
    descLower.includes("factoring")
  ) {
    return "https://www.rxil.in/";
  }

  if (descLower.includes("udyam") || descLower.includes("msme registration")) {
    return "https://udyamregistration.gov.in/Government-India/Ministry-MSME-registration.htm";
  }

  if (descLower.includes("mca") || descLower.includes("incorporation") || descLower.includes("roc")) {
    return "https://www.mca.gov.in/content/mca/global/en/home.html";
  }

  // 6. West Bengal Environmental & Factory Authorities
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

  // 7. Maharashtra State Authorities
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

  // 8. E-Waste & Extended Producer Responsibility (CPCB)
  if (
    descLower.includes("e-waste") ||
    descLower.includes("epr") ||
    authLower.includes("cpcb_ewaste") ||
    descLower.includes("extended producer responsibility")
  ) {
    return "https://eprewastecpcb.in";
  }

  // 9. Central Pollution Control Board
  if (
    authLower.includes("cpcb") ||
    authLower.includes("central pollution")
  ) {
    return "https://cpcb.nic.in";
  }

  // 10. Bureau of Indian Standards (BIS) & Technical Standards
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

  // 11. Food Safety & Standards (FSSAI)
  if (
    authLower.includes("fssai") ||
    descLower.includes("fssai") ||
    descLower.includes("foscos") ||
    descLower.includes("food safety")
  ) {
    return "https://foscos.fssai.gov.in";
  }

  // 12. General Labour / Factory Safety
  if (descLower.includes("factory") || descLower.includes("labour")) {
    return "https://shramsuvidha.gov.in";
  }

  // Generic fallback if authority has its own URL, else national portal
  if (explicitUrl && explicitUrl.trim() !== "") {
    return explicitUrl;
  }

  return "https://www.nsws.gov.in/";
}
