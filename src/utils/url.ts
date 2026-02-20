import { createHash } from "node:crypto";

export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    // Strip trailing slash, fragment, common tracking params
    url.hash = "";
    for (const param of ["utm_source", "utm_medium", "utm_campaign", "ref"]) {
      url.searchParams.delete(param);
    }
    url.searchParams.sort();
    let normalized = url.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return raw;
  }
}

export function hashUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}
