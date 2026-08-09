/**
 * Shared helpers for validating search input before it's sent to the backend.
 * MoodScout currently only knows how to process Pinterest board/pin URLs
 * (or plain keyword text). Any other URL should be rejected client-side
 * with a helpful error instead of failing silently/late on the results page.
 */

const PINTEREST_PATTERNS = [/pinterest\.com/i, /pin\.it/i, /pinterest\./i];

export function isPinterestUrl(value) {
  if (!value) return false;
  return PINTEREST_PATTERNS.some((pattern) => pattern.test(value));
}

// Matches http(s) links, bare domains (www.foo.com), or scheme-less domains
// followed by a path (foo.com/bar) — i.e. "looks like a URL" even without
// a protocol prefix.
const URL_LIKE_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?([/?#].*)?$/i;

export function looksLikeUrl(value) {
  if (!value) return false;
  const trimmed = value.trim();
  if (/\s/.test(trimmed)) return false; // plain keyword phrases have spaces
  return URL_LIKE_PATTERN.test(trimmed);
}

/**
 * Returns true when the input should be blocked: it looks like a URL but
 * isn't a Pinterest URL we know how to handle. Plain keyword searches
 * (no URL shape at all) are always allowed through.
 */
export function isUnsupportedUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return false;
  return looksLikeUrl(trimmed) && !isPinterestUrl(trimmed);
}
