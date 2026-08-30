# Security audit — Genezenz Pharmacy v2

Reviewed: all 76 source files, 12 API routes, 4 server-action files.
Method: automated pattern scan + manual review of every route and action,
plus 35 regression tests for the two fixes involving custom logic.

**Result: 2 high, 4 medium, 2 low. All fixed.**

---

## HIGH

### H1 — Open redirect on the login flow

`src/components/AuthForm.tsx` read `?next=` straight from the query string and
passed it to `router.push()` after a successful sign-in.

```
https://genezenz-pharmacy.in/login?next=https://evil.example
```

The link starts on the real pharmacy domain, so it survives inspection by a
cautious user. They sign in for real, and are then handed to the attacker's
page — typically a clone asking them to "confirm" their password or card.

**Fixed.** `src/lib/safe-redirect.ts` accepts only same-origin absolute paths.
Blocked: absolute URLs, protocol-relative `//host`, the `/\host` backslash
variant, non-HTTP schemes, and CRLF/null bytes. 18 tests in
`tests/safe-redirect.test.mjs`.

### H2 — Prescriptions stored unencrypted in public blob storage

`src/lib/storage.ts` wrote prescription files to Vercel Blob with
`access: 'public'`. A comment in the code claimed the blob was private. **It
was not** — Vercel Blob has no private tier.

The auth check on `/api/prescriptions/file/[id]` was therefore bypassable:
anyone who obtained the blob URL — from a log, a proxy, a browser history, a
shared screenshot — could read another patient's prescription directly,
skipping our ownership check entirely. These are medical records.

**Fixed.** Files are now encrypted with **AES-256-GCM** before they leave the
process. A leaked blob URL yields ciphertext. The key comes from
`FILE_ENCRYPTION_KEY`, or is derived from `AUTH_SECRET` via HKDF so it works
with no extra setup. Local-disk storage also gets `mode 0600`.

GCM is authenticated, so a tampered file fails to decrypt rather than
returning corrupted bytes. 17 tests in `tests/encryption.test.mjs` cover
round-trip, tamper detection on body/tag/IV, wrong key, and truncation.

> **Set `FILE_ENCRYPTION_KEY` in production.** Otherwise the key is tied to
> `AUTH_SECRET`, and rotating that would make existing prescriptions
> permanently unreadable.

---

## MEDIUM

### M1 — Response-header injection via upload filename

`Content-Disposition` was built from the uploaded filename with only `"`
stripped. A filename containing CR/LF could inject additional response
headers. **Fixed** — reduced to `[\w.\- ]`, capped at 80 characters.

### M2 — `imageUrl` accepted any URL scheme

Zod's `.url()` accepts `javascript:` and `data:`. The value is rendered into
an `<img src>` in the admin product form. Not directly exploitable in current
browsers, but it is an XSS sink one refactor away from mattering — and it
requires an admin account, so the realistic risk is a compromised admin
session rather than an outsider. **Fixed** — `http:`/`https:` allowlist.

### M3 — Image optimiser was an open proxy

`next.config.ts` had `remotePatterns: [{ hostname: '**' }]`. That lets anyone
call `/_next/image?url=…` with any URL and make the server fetch it — SSRF
against internal services, plus an egress bill someone else controls.
**Fixed** — explicit allowlist (Cloudinary, Wikimedia, Vercel Blob).

### M4 — Unbounded public database endpoints

`/api/search` and `/api/recommendations` had no rate limit. Search runs three
`ILIKE` scans per call. **Fixed** — 120/min and 60/min per IP. The Meta
webhook also got a 300/min cap so an attacker cannot make the server burn CPU
on HMAC verification.

---

## LOW

### L1 — No Content-Security-Policy

**Fixed.** CSP added covering `script-src`, `frame-ancestors`, `form-action`,
`base-uri` and `object-src 'none'`.

`'unsafe-inline'` remains on `script-src` because Next.js needs it for its
hydration bootstrap. Moving to nonces requires middleware-generated nonces on
every response — worth doing if the client ever handles card details directly,
unnecessary for cash-on-delivery.

### L2 — Rate limiting is per-instance

`src/lib/rate-limit.ts` holds counters in memory. On a multi-instance deploy,
the effective limit is *N × the configured value*. Fine on Vercel Hobby (one
instance) and documented in the file. Swap in Upstash Redis before scaling
out; the function signature does not change.

---

## Reviewed and found correct

| Area | Finding |
|---|---|
| SQL injection | Only one raw query, a parameterised tagged template. No `queryRawUnsafe` anywhere. |
| XSS | React escapes by default. One `dangerouslySetInnerHTML`, in JSON-LD, with `<` escaped. |
| IDOR | Orders, prescriptions and profile all filter or check on `session.sub`. Prescription route returns 404 (not 403) to a non-owner, so it doesn't confirm the id exists. |
| Price tampering | Order totals are computed from database prices. The client sends only ids and quantities. |
| Stock race | Decrement happens inside the order transaction via a conditional `updateMany`; two buyers cannot both take the last unit. |
| Cancellation | Returns stock inside a transaction, so inventory cannot drift. |
| Server actions | Every one re-checks authorisation. They are public HTTP endpoints, not protected by the UI that renders them. |
| Session | httpOnly + sameSite=lax + secure in production, 8-hour expiry, HS256 via `jose`. App refuses to boot without a 32+ char `AUTH_SECRET` — no fallback string. |
| User enumeration | Login runs a bcrypt compare even for unknown emails, and returns one generic message for every failure. |
| Webhook auth | HMAC-SHA256 over the raw body, `timingSafeEqual`, length-checked first. |
| File uploads | Validated by magic bytes, not the browser's Content-Type. Served with `nosniff` and a `sandbox` CSP. |
| Path traversal | Storage keys are `crypto.randomBytes`, never user input; the directory check is defence in depth. |
| CSRF | `sameSite=lax` cookies plus Next.js's built-in server-action origin check. Logout is POST. |
| Secrets | None in source. `.env` is gitignored. |
| Admin path check | `x-pathname` is `set` (not appended) by middleware, so a client-supplied header cannot forge it. |

---

## Not vulnerabilities, but gaps worth planning

1. **No password reset.** Users who forget a password must be reset manually
   by an admin. Worth adding before the customer base grows.
2. **No email verification.** Anyone can register with any address.
3. **No account lockout** beyond per-IP rate limiting. A distributed attack
   could still grind a specific account. Reasonable at this scale.
4. **No audit log.** For a pharmacy, a record of who viewed which prescription
   is worth having — both for the client's own protection and because it is
   the kind of thing a drug inspector may ask about.
5. **Cash on delivery only.** The moment card payments are added, PCI scope
   applies. Use a hosted Razorpay checkout so card data never touches this
   server.

---

## Run the tests

```bash
npm test
```

35 assertions covering the encryption and redirect fixes. Run them after
touching `src/lib/storage.ts` or `src/lib/safe-redirect.ts`.
