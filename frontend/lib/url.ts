/**
 * Utility functions for validating and sanitizing statutory portal URLs.
 */

export function sanitizeExternalUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // If the string contains a parenthetical or embedded URL like "(https://...)", extract it
  const match = trimmed.match(/https?:\/\/[^\s\)\"\'\,>]+/);
  if (match) {
    return match[0].replace(/[\.,;\)]+$/, "");
  }

  // If it already starts with http:// or https://
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/[\.,;\)]+$/, "");
  }

  // If it is a bare domain (e.g. "kspcb.karnataka.gov.in" or "saralsanchar.gov.in")
  if (/^[a-zA-Z0-9.-]+\.(gov\.in|nic\.in|in|org|com|net|edu)(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`.replace(/[\.,;\)]+$/, "");
  }

  // Otherwise it is non-URL text (e.g., "XGN Gujarat", "DISH Portal")
  return null;
}
