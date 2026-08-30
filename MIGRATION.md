# Migrating the old catalogue

The old site's 124 products are imported by a script — no copy-pasting.

```bash
npm run db:migrate-legacy                    # dry run: reports, writes nothing
npm run db:migrate-legacy -- --write         # import
npm run db:migrate-legacy -- --write --fix-images   # + try to recover images
```

Safe to re-run (products upsert on slug). The Render service sleeps on the free
tier, so the first request may take ~50 seconds to wake it.

---

## What transfers cleanly

All 124 products, with **15 categories** created automatically:

Skin Care · Liver Care · Neurology · Respiratory · Heart & BP · Antibiotics ·
First Aid · Pain Relief · Baby Care · Vitamins & Supplements · Eye Care ·
Allergy & Cold · Diabetes · Stomach & Digestion · Women's Health

Names, prices, MRP, stock, prescription flags, manufacturers and descriptions
all carry over. The descriptions are genuinely good — detailed, specific, and
long enough to rank, which is exactly what the new product pages need.

The script also derives a **`saltName`** from each product name
("Amlodipine 5mg" → composition field), which the old data didn't have.
That matters: people search for the generic name as often as the brand.

---

## What does NOT transfer, and why

### `rating` and `reviews`

Every old record carries a rating and a review count (4.6 stars, 1120 reviews).
There are no actual reviews behind those numbers.

They are **not migrated**. Publishing unverifiable review data as structured
data is a documented Google manual-action risk, and for a CDSCO-licensed
pharmacy an unsubstantiated claim is a regulatory exposure rather than just a
marketing one. When the client has real Google Business Profile reviews, those
can be surfaced instead — genuinely, with attribution.

---

## The image problem — read this before showing the client

**102 of the 124 product images do not load.** Verified by loading every URL.

| Source | Count | Status |
|---|---:|---|
| `commons.wikimedia.org` (Special:Redirect) | 100 | ✗ **Broken** — the files do not exist |
| `res.cloudinary.com` (client's own account) | 10 | ✓ Working, and legitimately theirs |
| `commons.wikimedia.org` | 6 | ✓ Working |
| `onemg.gumlet.io` | 3 | ⚠ Loads, but it is **Tata 1mg's CDN** |
| `cdn01.pharmeasy.in` | 1 | ⚠ **PharmEasy's CDN** |
| `www.practostatic.com` | 1 | ⚠ **Practo's CDN** |
| `5.imimg.com` | 1 | ⚠ IndiaMART seller upload |
| `canva.link` | 1 | ✗ Broken (share link, expired) |
| none | 1 | ✗ Missing |

**Two separate problems here.**

**1. The Wikimedia URLs point at files that were never there.** They use the
`Special:Redirect/file/…` pattern with invented filenames. Querying the Commons
API directly confirms it — `Bisoprolol_2.5mg_tablets.jpg`, `Biotin_supplement.jpg`
and `Paracetamol_tablets.jpg` do not exist. `Amoxicillin.JPG` does, which is why
a handful work. These look like plausible filenames that were guessed rather
than looked up.

**2. Six images are hotlinked from competitors.** 1mg, PharmEasy, Practo and an
IndiaMART seller. This is their copyright, used on a commercial site that
competes with them. It is also fragile — they can rename the file or block the
referrer whenever they like, and the shop silently loses its images.

The migration **drops all of these**. Products with no usable image render a
clean pill placeholder instead of a broken-image icon.

### `--fix-images`

Searches Wikimedia Commons for a genuine, freely-licensed photo of each
medicine. Matching is deliberately strict — the drug's name must appear in the
filename, and titles containing words like *recalled*, *rat*, *microscopy* or
*molecular structure* are rejected.

Loose matching recovered about 30% of the images, but roughly a third of those
were wrong: Ciprofloxacin eye drops matched a rat-cornea research photo, and one
product matched an image captioned "RECALLED". A wrong photo on a medicine page
is worse than no photo. Strict matching recovers **around 15%**, and what it
returns is correct.

So expect roughly **15–20 images recovered**, leaving **80-odd products needing
real photographs.**

### Getting the rest

In order of preference:

1. **Photograph the packs.** The client has the stock on the shelf. A phone
   camera on a white surface near a window is genuinely fine, and it is the
   only route that produces images nobody can dispute or take away. It also
   photographs *their* actual stock, which is more honest than a stock photo of
   a different manufacturer's box.
2. **Manufacturer media assets.** Cipla, Sun Pharma, Abbott and others publish
   product imagery for trade partners. Ask, and get it in writing.
3. **Licensed stock photography** for generic categories (baby care, first aid).

The client already has a Cloudinary account (`da52b1mqa`, folder `genezenz`)
with 10 images in it — that is where new uploads should go. Paste the Cloudinary
URL into the Image URL field in `/admin/products`.

**Suggested order of work:** photograph the top 20 sellers first. Those pages
carry most of the traffic and all of the revenue; the long tail can keep
placeholders for now without hurting anything.

---

## One compliance point to raise with the client

The catalogue includes **Alprazolam 0.25mg**, a Schedule H1 controlled
substance, alongside other Schedule H drugs.

Schedule H1 medicines carry specific obligations in India: a separate register
retained for three years, the prescriber's details recorded, and the mandated
warning label. Online sale of Schedule H1 drugs is legally contested and has
been the subject of court orders and draft e-pharmacy rules that are still not
settled.

This is not a reason to panic, and it is not something you can resolve as the
developer — but the client should confirm with their pharmacist-in-charge and
ideally their legal advisor which items they are comfortable listing online.
The pragmatic middle ground most pharmacies take: list Schedule H1 items as
"available in store, prescription required" and take the order by phone rather
than through the cart. It is a small change to the product record — set
`published: false`, or mark it Rx-required and note it in the description.

Better to ask now than after a drug inspector does.
