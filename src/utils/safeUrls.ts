export type SafeUrlOptions = {
  allowedHosts?: string[];
};

/**
 * Minimal external URL sanitizer for opening links.
 * - Allows only https URLs
 * - Optional hostname allowlist
 */
export function sanitizeExternalHttpsUrl(
  input: string,
  options: SafeUrlOptions = {},
): string | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;

  if (options.allowedHosts?.length) {
    const host = url.hostname.toLowerCase();
    const allowed = options.allowedHosts.map((h) => h.toLowerCase());
    if (!allowed.includes(host)) return null;
  }

  return url.toString();
}

