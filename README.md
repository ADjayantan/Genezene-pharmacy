# Genezenz Pharmacy — v2 Platform

Next.js 15 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind v4

Rebuild of the existing Genezenz Pharmacy site with three goals:
**rank on Google**, **load fast**, and **pull Facebook / Instagram / WhatsApp
leads into one admin inbox**.

---

## What's in the box

Everything from the previous site, rebuilt server-rendered, plus the lead inbox.

**Storefront** — home · product catalogue with search, category filter, sort and
pagination · product detail pages · live search autocomplete · cart · checkout ·
order confirmation · prescription upload · insurance guide · about · contact ·
8 local-area landing pages · pharmacy assistant chat · WhatsApp button

**Accounts** — register · sign in · profile · order history · prescription history

**Admin** — dashboard · **unified lead inbox** · product CRUD with per-product SEO
fields · order management with stock restoration on cancel · prescription review
with pharmacist notes

**APIs** — Meta lead webhook · lead capture · search · orders · prescription
upload · auth-gated prescription file serving · chat · openFDA lookup

---

## Quick start

```bash
cp .env.example .env         # fill in DATABASE_URL, AUTH_SECRET, ADMIN_PASSWORD
openssl rand -base64 48      # → paste into AUTH_SECRET

npm install
npx prisma db push           # create tables
npm run db:seed              # create the admin user
npm run dev                  # http://localhost:3000
```

`db:seed` creates the admin user, 6 categories and 8 sample products.
**The seeded prices are placeholders — set real ones in `/admin/products` before go-live.**

Admin panel: `http://localhost:3000/admin`

> `db:seed` **refuses to run** without `ADMIN_EMAIL` / `ADMIN_PASSWORD` (min 12 chars).
> There is deliberately no default password — that is how small sites get taken over.

---

## Why this stack ranks better than the old one

The old site rendered products with client-side `fetch()`. Googlebot receives an
empty shell on first pass and has to queue the page for a second, JavaScript-enabled
crawl that can take days or may never happen. That is the main reason a
vanilla-JS catalogue struggles to rank.

Here, every public page is **server-rendered**. The `<h1>`, the product name, the
price and the description are all in the initial HTML response.

| | Old site | This build |
|---|---|---|
| Product HTML | Rendered by JS after load | In the first HTML response |
| Title / description | One set for the whole site | Unique per page |
| Structured data | None | Pharmacy + Product + FAQ + Breadcrumb JSON-LD |
| Sitemap | None | Auto-generated from the DB, hourly |
| Local landing pages | None | One per delivery area |
| Images | Raw `<img>` | AVIF/WebP, sized, lazy |

---

## SEO: what's built in

**Technical**
- `sitemap.ts` — regenerates from the database every hour, so a product added in
  the admin panel gets submitted to Google automatically.
- `robots.ts` — blocks `/admin`, `/api`, `/cart`, `/checkout` and faceted URLs
  (`?sort=`, `?page=`) so crawl budget goes to pages that can actually rank.
- Canonical URLs on every page — kills duplicate-content dilution from filters.
- Security + caching headers in `next.config.ts`.

**Structured data** (`src/lib/seo.tsx`)
- `Pharmacy` — name, address, geo, opening hours, service areas, payment methods.
  This is what feeds the Google Business panel and the local map pack.
- `Product` — price, currency, stock status. Produces price-in-search rich results.
- `FAQPage` — expandable Q&A directly in the search result. Big CTR lift.
- `BreadcrumbList` — replaces the raw URL in the result with a readable trail.

> **Deliberately omitted: `aggregateRating`.** The old site displays "4.8★" and
> "50,000+ customers". Putting unverifiable self-reported ratings into schema is a
> [Google manual action](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
> risk. Once the client has real Google Business Profile reviews, wire those in.
> Also worth confirming with the client that those figures are accurate before
> they stay on the page at all — for a licensed pharmacy this is a compliance matter,
> not just a marketing one.

**Local SEO — the highest-ROI piece**

A single-branch pharmacy cannot outrank Apollo, Netmeds or PharmEasy for
"buy medicines online". It *can* own "medical shop in Saibaba Colony".

`/pharmacy-in-[area]-coimbatore` generates a real, statically-rendered page for
every area in `site.serviceAreas` — currently 8. Each has unique copy, its own
title/description, its own lead form, and internal links from the footer.

Add an area to `src/lib/config.ts` → a new page, a new sitemap entry, new internal
links. No other code changes.

---

## The lead inbox

Every channel writes to one `Lead` table, so the pharmacy sees a single stream
instead of checking four apps.

```
Facebook Lead Ad  ─┐
Instagram Lead Ad ─┤→  /api/webhooks/meta  ─┐
                   │                        ├→  Lead table  →  /admin/leads
Website form      ─┼→  /api/leads          ─┤
WhatsApp click    ─┘  (prefilled message)  ─┘
```

**Working today, no approval needed:** website form, WhatsApp click-to-chat.
**Needs Meta approval:** Facebook and Instagram ad leads (see below).

The webhook code is complete and live. It stays dormant while the Meta env vars
are empty — nothing breaks, and the admin panel shows a banner explaining the state.

### Webhook security

`src/lib/meta.ts` verifies Meta's `X-Hub-Signature-256` header: HMAC-SHA256 over
the **raw** request body, compared with `crypto.timingSafeEqual`.

Without this, the webhook URL is public and anyone who guesses it can inject fake
leads. This is the single most commonly skipped step in Meta integrations.

Two other things the handler gets right:
- **Returns 200 immediately**, then processes asynchronously. Meta retries with
  backoff and eventually disables subscriptions that respond slowly.
- **Dedupes on `leadgen_id`** (unique column + `P2002` catch). Meta re-delivers
  the same lead on any hiccup.

---

## Connecting Meta (do this in parallel with development)

Budget **1–3 weeks** for approval. Start on day one.

1. **Meta Business Suite** → Business Settings → **Business Verification**.
   Needs the pharmacy's GST certificate or drug licence and a utility bill.
   *This is the long pole — everything else takes an afternoon.*
2. **developers.facebook.com** → Create App → type **Business**.
3. Add the **Webhooks** product → subscribe to **Page** → field `leadgen`.
   - Callback URL: `https://yourdomain.com/api/webhooks/meta`
   - Verify token: any long random string → also put it in `META_VERIFY_TOKEN`
   - Click Verify. The `GET` handler echoes the challenge back.
4. Add **Facebook Login for Business**, request the `leads_retrieval`,
   `pages_show_list` and `pages_manage_metadata` permissions → **App Review**.
5. Generate a **long-lived Page access token** → `META_PAGE_ACCESS_TOKEN`.
6. Copy the **App Secret** → `META_APP_SECRET`.
7. Link the Instagram professional account to the same Facebook Page. Instagram
   lead ads then arrive through the same webhook; `lead.platform` is `"ig"` and
   the dashboard tags them Instagram automatically.

Test before go-live with Meta's **Lead Ads Testing Tool** — it fires a real
signed webhook without spending ad budget.

### On WhatsApp

Two very different things, often confused when quoting:

| | Click-to-chat | Cloud API |
|---|---|---|
| Setup | A link. Done. | Business verification + number registration |
| Cost | Free | Per-conversation pricing |
| Reply from dashboard | No — opens WhatsApp | Yes |
| In this build | ✅ Working | Phase 2 |

Click-to-chat with a prefilled message covers most of the value: the customer's
first message already identifies them as a website lead.

---

## Deploy

**Vercel** (recommended — it's the Next.js host, and the free tier is enough here)
1. Import the repo, add all `.env` variables
2. Postgres: [Neon](https://neon.tech) or [Supabase](https://supabase.com) free tier
3. Add the domain, then in Search Console submit `https://yourdomain.com/sitemap.xml`

**Do not use GitHub Pages.** It serves static files only — no server rendering,
no API routes, no webhook. That would remove the entire reason for this rebuild.

---

## Product recommendations

Two signals, blended by how much evidence actually exists.

**Content similarity (works from day one).** TF-IDF over tags, composition,
name and category, compared with cosine similarity. The legacy catalogue has
tags on 123 of 124 products, which turns out to be a strong signal — tags and
salt name are weighted well above description text, because two products
sharing the tag *antihistamine* are related while two sharing the word
*patients* are not.

**Co-purchase (kicks in with real orders).** A self-join over `OrderItem`:
what was in the same basket. Its weight ramps from zero at no orders to full
around 25 co-occurrences, so it contributes nothing until it has earned the
right to.

Verified against the real 124-product catalogue:

| Product | Top suggestions |
|---|---|
| Dolo 650 | Paracetamol 500mg · Combiflam · Ibuprofen 400mg · Nimesulide |
| Amlodipine 5mg | Bisoprolol · Telmisartan · Ramipril · Nitroglycerin |
| Cetirizine 10mg | Levocetirizine · Loratadine · Sinarest · Montelukast |
| Empagliflozin | Sitagliptin · Metformin · Voglibose · Glipizide |

Clinically coherent in every case — the antihypertensives group together, the
antidiabetics group together, the analgesics group together.

### Why not a neural model

124 products and no order history. A matrix-factorisation or embedding
approach would add latency and a dependency, and at this scale it would not
beat TF-IDF over good tags. If the catalogue reaches a few thousand SKUs with
real traffic, the upgrade path is to precompute embeddings into a
`ProductSimilarity` table — the function signatures in
`src/lib/recommendations.ts` would not change.

### Pharmacy safety rules

Recommending medicines is not recommending shoes.

- **Prescription medicines never appear in "often bought together".**
  Suggesting an Rx drug because other people bought it invites self-medication
  and can surface a dangerous combination.
- **Rx products appear only under "similar medicines"**, within the same
  category, labelled prescription-required, with a note telling the customer
  not to switch a prescribed medicine without asking a doctor or pharmacist.
- **Cross-sells are OTC-only** — devices, wellness, first aid.
- **A pairing must occur at least twice** before it is shown. One coincidental
  basket is noise.
- **The section renders nothing when there is no evidence.** A fabricated
  "customers also bought" on a pharmacy site is misleading and, for medicines,
  unsafe.

---

## Security decisions worth knowing

Written down because they are the parts a reviewer would check, and the parts
that are easy to undo by accident later.

- **Order prices come from the database, never the request body.** A client that
  POSTs `{price: 1}` cannot buy a ₹500 medicine for ₹1.
- **Stock is decremented inside the same transaction as the order**, with a
  conditional `updateMany`. Two customers buying the last unit at the same
  moment cannot both succeed.
- **Cancelling an order returns the stock**, so inventory doesn't silently drift.
- **Prescriptions are never served statically.** `/api/prescriptions/file/[id]`
  checks ownership on every request and responds `404` (not `403`) to a
  non-owner, so it doesn't confirm that the id exists.
- **Uploads are validated by magic bytes**, not the browser's Content-Type. The
  response also carries `nosniff` and a `sandbox` CSP, so a file that somehow
  slipped through still cannot execute.
- **Login runs a bcrypt compare even for unknown emails.** Returning early would
  make "no such user" measurably faster than "wrong password" and let an
  attacker enumerate accounts by timing.
- **Every server action re-checks authorisation.** Server Actions are public HTTP
  endpoints; a button that only renders for admins proves nothing.
- **Sessions are httpOnly + sameSite cookies**, 8-hour expiry, signed with
  `AUTH_SECRET`. The app refuses to boot if that secret is missing or short —
  no insecure fallback string.
- **Rate limits** on login, register, lead submission, orders, uploads and chat.
- **The chatbot refuses medical questions** — dosage, interactions, "what should
  I take" — and hands the customer to a pharmacist. An unsupervised bot giving
  dosing advice on a licensed pharmacy's own site is a liability the client
  does not want.

Products that appear in past orders are **unpublished rather than deleted**, so
order history never breaks.

---

## Handover checklist

- [ ] `AUTH_SECRET` is a fresh 48-byte random value, not copied from anywhere
- [ ] `ADMIN_PASSWORD` changed and stored in the client's password manager
- [ ] Exact business coordinates from the client's Google Business Profile → `config.ts`
- [ ] Google Search Console verified, sitemap submitted
- [ ] Google Business Profile claimed and matching the site's NAP exactly
      (name, address, phone — character for character, or local ranking suffers)
- [ ] Confirm the "50,000+ customers / 4.8★" claims with the client
- [ ] Real product prices entered (seed data is placeholder)
- [ ] `BLOB_READ_WRITE_TOKEN` set if deploying to Vercel (prescriptions need it)
- [ ] Meta webhook verified with the Lead Ads Testing Tool
- [ ] Privacy policy and Rx policy pages written (Meta App Review requires a
      live privacy policy URL — do not leave this to the last day)
