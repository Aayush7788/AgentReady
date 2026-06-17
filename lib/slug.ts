const INVALID_URL_CHARS = /[<>{}|\\^`\x00-\x1f]/;

export function normalizeDocsUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500 || INVALID_URL_CHARS.test(trimmed)) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (!parsed.hostname || !parsed.hostname.includes(".")) return null;
    if (parsed.username || parsed.password) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function urlToSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");
    const path = parsed.pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-");
    return nameToSlug(path ? `${host}-${path}` : host) || "unknown";
  } catch {
    return "unknown";
  }
}

export function displayNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname
      .replace(/^www\./i, "")
      .replace(/^(docs|developer|developers|api|reference)\./i, "");
    const label = host.split(".")[0] ?? "Unknown";
    return label
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Unknown";
  }
}

