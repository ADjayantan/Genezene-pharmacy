# Pre-handover checklist — Genezenz Pharmacy

Everything that should be true before this site is handed to the client and
pointed at a real domain. Items I could build in software are already ticked;
what remains is client content, account actions, and Meta's approval clock. Grouped by who owns it. Items marked **BLOCKER** must
not be skipped for a licensed pharmacy selling online in India.

---

## 1. Legal & compliance — the part most sites get wrong

An online pharmacy in India is not a normal shop. These are not optional polish.

- [x] **BLOCKER — Drug licence displayed.** (display built in footer + About; client fills the number in config) The retail drug licence number (Form
  20/21) must appear in the footer and on the About page. A pharmacy selling
  online without a visible licence number invites a drug-inspector notice.
- [x] **BLOCKER — Registered pharmacist named.** (display built; client fills the name/reg in config) The name and registration number
  of the pharmacist-in-charge should be shown. This is what makes "pharmacist
  verified" a true claim rather than marketing.
- [x] **BLOCKER — Privacy policy live.** Required by the DPDP Act 2023, and Meta
  App Review will not approve the lead webhook without a public privacy-policy
  URL. Page is built (`/legal/privacy`) — the client's details and a lawyer
  review are what remain.
- [x] **BLOCKER — Prescription policy.** Which medicines need a prescription, how
  it is verified, how long it is retained. Schedule H / H1 / X handling stated.
  Page built (`/legal/prescription-policy`).
- [x] **Terms of service, shipping policy, returns & refund policy.** All built
  under `/legal/*`. Each carries a "review with your lawyer" note and placeholder
  fields (GSTIN, licence number) the client must fill.
- [ ] **Schedule H1 decision made.** The catalogue includes Alprazolam and other
  Schedule H1 drugs. Confirm with the pharmacist-in-charge which are listed
  online vs "in-store, prescription required, phone to order". Legally contested
  for online sale — get this in writing.
- [ ] **GST invoice capability confirmed.** The site promises GST invoices;
  ensure the client can actually issue them with GSTIN + licence number.
- [ ] **No banned/unverifiable medical claims.** No "cures", no guaranteed
  outcomes. The chatbot already refuses dosing advice — keep it that way.
- [ ] **Age/consent for certain products.** Emergency contraception and similar
  are in the catalogue; confirm the client is comfortable listing them and
  whether any gating is wanted.

## 2. Content the client must supply

- [ ] **BLOCKER — Real product prices.** Seed/migration prices are illustrative.
- [ ] **Cost prices** for margin reporting (optional but recommended; without
  them the dashboard shows "—" rather than a guess).
- [ ] **BLOCKER — Product photography.** ~80 products have no usable image (the
  old catalogue's were broken or hotlinked from competitors). Shoot the top
  sellers; see `MIGRATION.md`.
- [ ] **The homepage stats.** "50,000+ customers / 4.8★ / 500+ cities" from the
  old site were removed as unverifiable. If the client wants numbers, they must
  be real and substantiable.
- [ ] **Exact Google Business Profile coordinates** for the map/schema.
- [ ] **Real opening hours / holiday exceptions** confirmed.
- [ ] **Social links** (the Facebook page exists; Instagram/others if any).

## 3. Deployment & infrastructure — client + you

- [ ] Domain purchased and DNS pointed (`.in` or `.com`).
- [ ] Deployed to Vercel (NOT GitHub Pages — it can't run the server).
- [ ] **BLOCKER — `AUTH_SECRET`** is a fresh 48-byte value, not the dev one.
- [ ] **BLOCKER — `FILE_ENCRYPTION_KEY`** set (else prescription encryption is
  tied to AUTH_SECRET and rotating it locks out old files).
- [ ] **BLOCKER — Vercel Blob** connected (else uploaded prescriptions vanish on
  redeploy).
- [ ] Postgres on a paid-enough tier for real traffic (Neon/Supabase free is
  fine to launch).
- [ ] **The Neon connection string used during setup was pasted into a chat —
  rotate it** before launch (Neon → reset password) and update `.env`.
- [ ] Custom `ADMIN_PASSWORD` set and handed to the client via their password
  manager, changed at first login. The `ChangeMe-…` placeholder is not for
  production.
- [ ] Backups: confirm the database provider's automatic backups are on.

## 4. Meta (Facebook/Instagram) leads — start early

- [ ] Business Verification submitted (needs GST cert or drug licence + a bill).
  **1–3 weeks, Meta's clock — start day one.**
- [ ] App Review for `leads_retrieval` submitted (needs the live privacy URL).
- [ ] Webhook verified with Meta's Lead Ads Testing Tool.
- [ ] `META_APP_SECRET` + `META_PAGE_ACCESS_TOKEN` added once approved.
- [ ] Instagram professional account linked to the Facebook Page.

## 5. SEO & analytics

- [ ] Google Search Console verified; `sitemap.xml` submitted.
- [ ] Google Business Profile claimed; NAP matches the footer character-for-char.
- [ ] `NEXT_PUBLIC_GA_ID` / analytics set (behind cookie consent — see below).
- [x] Product pages prerendered (`generateStaticParams` added — confirm they
  show as `○ Static` in the next build).
- [x] OG/Twitter images render for the homepage and a product page.
- [ ] robots.txt blocks `/admin`, `/api`, cart/checkout/profile.

## 6. Privacy & cookies

- [x] Cookie consent banner present, declines non-essential by default
  (built — `CookieConsent`).
- [x] **Analytics/marketing scripts load ONLY after consent.** Wire GA behind the
  consent state; do not fire it on first paint.
- [ ] Prescription files served only through the auth-gated route (done).
- [ ] Customer data page carries the "not a marketing list" note (done).

## 7. Trust & conversion polish

- [ ] Real pharmacist photo / a human face on About (people trust a face).
- [ ] At least a few genuine testimonials or Google reviews surfaced — real ones,
  with attribution, not invented.
- [ ] Payment: cash-on-delivery works today. If online payment is wanted, use a
  hosted Razorpay checkout (keeps card data off this server — PCI scope).
- [ ] An order-confirmation email/SMS (currently the pharmacist calls; an
  automated confirmation reduces "did my order go through?" calls). Phase 2.

## 8. Accessibility & quality

- [ ] Keyboard-only pass through the buy flow.
- [ ] Colour contrast checked in light AND dark mode.
- [ ] Screen-reader smoke test on the homepage and checkout.
- [ ] 404 and error pages calm and useful (done).
- [ ] Test on a real low-end Android phone on mobile data — this is the actual
  customer device.

## 9. Operations & handover

- [ ] Client trained on the admin: add/edit products, review prescriptions,
  update order status + tracking, read the dashboard.
- [ ] Who monitors the lead inbox, and how fast do they call back? (The whole
  lead feature is worthless if nobody acts on it.)
- [ ] Return/refund process the staff actually follow, matching the policy page.
- [ ] A named person owns the Meta paperwork through to approval.
- [ ] Source code + this repo handed over; secrets NOT in the repo.
- [ ] A simple runbook: how to add a product, how to deploy an update.

## 10. Things deliberately left for Phase 2

Not blockers, but name them so the client isn't surprised later:

- Password reset (needs transactional email).
- Email/SMS order notifications.
- Online payment (Razorpay).
- WhatsApp Cloud API two-way inbox.
- Audit log of who viewed which prescription.
- Multi-instance Redis rate limiting (only when traffic needs it).

---

### The three that will actually bite if skipped

1. **Privacy policy live** — Meta blocks on it, and DPDP Act requires it.
2. **Drug licence + pharmacist shown** — regulatory exposure for a licensed shop.
3. **Real prices + product photos** — the site literally cannot sell without them.

Everything else can follow launch. These three cannot.
