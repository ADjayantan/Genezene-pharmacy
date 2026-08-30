# QA report — used as a customer and as the shop owner

Every core flow was driven end-to-end (32 flow assertions passing). Below is
what works, what's genuinely missing, and what's worth adding — separated into
quick wins and later.

---

## ✅ What works (verified by simulating the real flows)

**Admin — add a product with an image**
- Add product → it appears in the shop immediately.
- Image pasted in the form → carries onto the product and shows as the primary.
- Gallery: add / make-primary / remove all work; multiple images supported.
- Cost price saved → margin computes on the dashboard.
- Slug auto-generated; edit form prefilled correctly.
- Delete guard: a never-ordered product is removed; one in past orders is hidden
  (order history stays intact).

**Customer — full shopping journey**
- Search finds by name, brand and salt (e.g. "dolo", "paracetamol").
- Product page shows price, MRP, composition label, stock, similar medicines.
- Add to cart → quantity, subtotal, delivery fee all correct.
- Free-delivery threshold flips to Free above ₹499 (with the progress bar).
- Cart cross-sell never suggests a prescription medicine.
- Checkout requires sign-in; order places, cart clears, order number issued.
- Order gets a status timeline; confirmation page and My Account both show it.
- Prescription upload → appears in My Account as PENDING with a timeline.
- Chat refuses dosage questions and hands off to a pharmacist; answers stock,
  delivery and hours.

**The core buy-and-dispense loop is solid.** Nothing in it is broken.

---

## 🔴 Real gaps found (things a customer/owner will miss)

### Customer side

1. **No "Buy again" / reorder.** A pharmacy's best customers reorder the same
   chronic medicines (BP, diabetes, thyroid) every month. Right now they must
   search and re-add each item. **This is the single highest-value missing
   feature for repeat revenue.**
2. **Order in My Account isn't clickable to live tracking.** The order
   confirmation page has courier + tracking + timeline, but from My Account the
   order is shown inline and doesn't link there. A customer can't easily check
   "where is my order now".
3. **No "notify me when back in stock."** An out-of-stock product is a dead end;
   the customer leaves and may not return. A one-field "tell me when it's back"
   captures that demand (and is a lead).
4. **No saved addresses.** Checkout prefills one address from the profile;
   someone ordering for a parent at a different address retypes it every time.
5. **No customer-initiated cancellation.** They must call to cancel a pending
   order.
6. **Filters are thin.** Category + sort exist, but no "in-stock only", no price
   range, and no "prescription / OTC" filter. Fine for 124 products, limiting as
   the catalogue grows.

### Owner / admin side

7. **Customers page is a list only** — you can't click a customer to see their
   full order and prescription history in one place. Useful for follow-up calls.
8. **No CSV import/export.** Adding products one by one is slow at scale, and
   there's no sales/orders export for the accountant. A CSV in/out would save
   real time.
9. **Coupons are hardcoded.** GENEZENZ10 lives in the config file; the client
   can't create or expire an offer without a developer.
10. **Dashboard date range is fixed at 30 days.** No "this month vs last", no
    custom range.
11. **No returns/refund workflow in admin.** The policy page exists, but there's
    no button to mark an order returned/refunded and restock it.

### Not bugs, but launch blockers (already flagged)

- Real prices and product photos are client content.
- Drug licence number / pharmacist name need filling in config.
- No email/SMS order confirmation (the pharmacist calls) — phase 2.

---

## Recommended additions, prioritized

### Quick wins — high value, small effort (worth doing before/at launch)

| # | Feature | Why | Effort |
|---|---|---|---|
| 1 | **Buy again** from My Account | Repeat revenue; chronic-med customers | ~2h |
| 2 | **Order → tracking link** in My Account | Cuts "where is my order" calls | ~1h |
| 3 | **Back-in-stock notify** (one field, lands as a lead) | Recovers lost demand | ~2h |
| 4 | **Admin customer detail** (click → their orders + Rx) | Better follow-up | ~2h |
| 5 | **"In-stock only" filter toggle** | Removes dead ends | ~1h |

### Phase 2 — real value, more work

- Saved addresses / address book.
- Customer order cancellation.
- CSV product import + orders export.
- Coupon management in admin (create/expire offers).
- Dashboard date-range selector + this-vs-last comparison.
- Returns/refund workflow in admin (mark returned, restock, refund note).
- Email/SMS order confirmation (needs a provider).
- Reviews / Q&A (only with real, verified reviews).

---

## Bottom line

The site does what a pharmacy shop needs: browse, search, buy, upload a
prescription, and run the whole back office. **Nothing core is broken.**

The gaps are about **repeat business and owner efficiency**, not the core loop.
If I build just the five quick wins — especially **Buy again** and **order
tracking from the account** — the site goes from "works" to "customers come
back", which is where a pharmacy actually makes its money.

Say the word and I'll build the quick wins now.
