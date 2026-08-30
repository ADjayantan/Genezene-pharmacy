# Genezenz Pharmacy v2 — Scope, Feature Parity & Timeline

For: Jayantan · Client: Genezenz Pharmacy, Ganapathy, Coimbatore

---

## 1. Feature parity — nothing from the old site gets dropped

Every feature in the current `ADjayantan/medplus` repo, and where it stands.

### Built in this scaffold

| Feature | Status | Notes |
|---|---|---|
| Home page | ✅ Done | Server-rendered, SEO copy, FAQ, lead form |
| Offer strip (GENEZENZ10, free delivery ₹499) | ✅ Done | CSS only, no JS cost |
| Header + nav | ✅ Done | Sticky, responsive |
| Footer (address, phone, hours, CDSCO, social) | ✅ Done | Real brand data from the old site |
| Product listing | ✅ Basic | Grid renders from DB; needs filters + search UI |
| Contact page | ✅ Done | Was `contact.html` |
| Admin login | ✅ Done | httpOnly cookie, rate limited, timing-safe |
| Admin dashboard / stats | ✅ Done | Was `admin-dashboard.html` |
| **Unified lead inbox** | ✅ Done | **New — the client's headline ask** |
| WhatsApp button | ✅ Done | **New** |
| Local area landing pages | ✅ Done | **New — 8 pages, biggest SEO win** |
| Sitemap / robots / JSON-LD | ✅ Done | **New** |

### To port from the old site (day 2–3)

| Feature | Old file | Effort |
|---|---|---|
| Product search + autocomplete | `index.html` inline JS | 3h — server-side search, better than the old overlay |
| Product detail page | — | 2h — `/products/[slug]` with Product JSON-LD |
| Category filter / sort | `products.html` | 2h |
| Cart | `cart.html`, `js/cart.js` | 3h |
| Checkout | `checkout.html` | 3h |
| Login / Register | `login.html`, `register.html` | 2h — auth layer already exists |
| Profile / my orders | `profile.html` | 2h |
| Upload prescription | `upload-prescription.html` | 3h — keep the auth-gated file serving |
| Insurance comparison | `insurance.html` | 2h |
| Chatbot | `routes/chat.js`, `js/chatbot.js` | 2h — port the proxy route |
| FDA lookup | `routes/fda.js` | 1h |
| Admin: products CRUD | `admin-products.html` | 3h |
| Admin: orders | `admin-orders.html` | 2h |
| Admin: prescriptions review | `admin-prescriptions.html` | 2h |
| About page | `about.html` | 1h |
| Toast notifications | inline | 1h |

**Total remaining: roughly 34 hours.**

---

## 2. The timeline conversation

You said 2–3 days. Here is the honest arithmetic.

34 hours of porting, plus testing, plus data migration from MongoDB to Postgres,
plus deployment. Three days at 10 hours a day is 30 hours. It does not fit —
and the parts that get rushed are cart and checkout, which is exactly where bugs
cost the client money.

**Two things are outside your control entirely:**

| Blocker | Realistic time | Who controls it |
|---|---|---|
| Meta Business Verification | 3 days – 2 weeks | Meta |
| Meta App Review (`leads_retrieval`) | 3 days – 2 weeks | Meta |
| Google indexing new pages | 1–4 weeks | Google |
| Local pack ranking movement | 4–12 weeks | Google |

If you promise "Facebook leads in the dashboard in 3 days", you will miss the
date because of Meta, not because of you. Say this to the client up front and it
reads as expertise. Say it on day 3 and it reads as an excuse.

### Suggested phasing

**Phase 1 — 4 to 5 days.** Everything above, live, with website + WhatsApp leads
working. Meta paperwork submitted on day 1 so the clock is already running.

**Phase 2 — switch-on, ~2 hours whenever Meta approves.** Paste two env vars.
The code is already written and deployed. Nothing to rebuild.

**Phase 3 — optional retainer.** WhatsApp Cloud API two-way inbox, Google
Business Profile management, monthly SEO reporting, content pages.

If the client will not move off 3 days: ship the marketing site (home, areas,
contact, products, lead capture) on the new stack, keep cart and checkout on
the existing Render backend for now, and port them in week 2. The client gets
their SEO and lead dashboard on time, and nothing breaks in the meantime.

---

## 3. What to actually say to the client

> The new site is server-rendered, which is what lets Google index your product
> pages properly — that's the main thing holding the current site back. I'm also
> building a page for each area you deliver to, because "medical shop in Saibaba
> Colony" is a search you can realistically win, whereas "buy medicines online"
> is dominated by national players with large ad budgets.
>
> All your Facebook, Instagram, WhatsApp and website enquiries land in one
> dashboard, so nothing gets missed across four different apps.
>
> One dependency worth flagging early: pulling leads out of Facebook and
> Instagram requires Meta to verify your business and approve the app. That
> typically takes one to three weeks and it's entirely on Meta's side. I'd like
> to start that paperwork on day one — I'll need your GST certificate or drug
> licence. Everything else works without it, and the moment approval lands I
> flip a switch; no extra development.

---

## 4. Pricing note

You are delivering a Next.js rebuild, a full SEO implementation, local landing
pages, and a Meta lead integration. That is not a "make me a website" job — the
lead dashboard alone replaces a subscription tool.

If you quoted before scoping this, it is reasonable to go back with the phase
breakdown above and price Phase 3 separately as a monthly retainer. Recurring
revenue beats one-off builds, and SEO genuinely needs ongoing work to hold.

---

## 5. Two things to raise with the client

1. **The stats on the current homepage** — "50,000+ customers", "500+ cities",
   "4.8★ rating", "24/7 support". If these aren't accurate they should come off.
   For a CDSCO-licensed pharmacy, unverifiable claims are a regulatory exposure,
   not just a marketing one. And a site whose hours say Mon–Sat 9–8 while a badge
   says 24/7 support looks careless to a customer.

2. **The old repo committed a base64 logo and a live Render API URL into the
   frontend.** Fine, but confirm no `.env` or seed credentials were ever pushed.
   Run `git log -p -- backend/.env` and `git log -p -- backend/seed.js` on the
   old repo before handing it over. If a real secret was ever committed, rotate
   it — deleting the file later does not remove it from git history.
