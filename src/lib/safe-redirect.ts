/**
 * Validate a `?next=` redirect target.
 *
 * WHY: `/login?next=https://evil.example` would otherwise send the user to an
 * attacker's site immediately after they authenticate — a textbook open
 * redirect, and an effective phishing primitive because the link genuinely
 * starts on the real pharmacy domain.
 *
 * Only same-origin absolute paths are allowed. Rejected:
 *   https://evil.com        absolute URL
 *   //evil.com              protocol-relative — browsers treat this as absolute
 *   /\evil.com              some parsers normalise the backslash to a slash
 *   javascript:alert(1)     scheme
 */
export function safeNext(value: string | null | undefined, fallback = '/profile'): string {
  if (!value) return fallback;
  const v = value.trim();

  if (!v.startsWith('/')) return fallback;   // must be a path
  if (v.startsWith('//')) return fallback;   // protocol-relative
  if (v.startsWith('/\\')) return fallback;  // backslash trick
  if (/[\x00-\x1f]/.test(v)) return fallback; // control chars / CRLF

  return v;
}
