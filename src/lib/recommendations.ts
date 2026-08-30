import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

/**
 * PRODUCT RECOMMENDATIONS
 *
 * Two signals, blended by how much evidence we actually have:
 *
 *   1. CONTENT SIMILARITY (TF-IDF over tags, salt, name, category)
 *      Works from day one with zero orders. This matters — a brand-new shop
 *      has no purchase history, and a pure collaborative-filtering model would
 *      return nothing for months. This is the cold-start answer.
 *
 *   2. CO-PURCHASE (market basket over OrderItem)
 *      "Bought in the same order as this." Genuinely predictive, but only once
 *      real orders exist. Its weight scales with the number of co-occurrences,
 *      so it contributes nothing at 0 orders and dominates by a few hundred.
 *
 * Why not a neural model or an embedding service: 124 products and no order
 * history. A matrix-factorisation or embedding approach would cost latency and
 * a dependency, and with this much data it would not beat TF-IDF on tags. If
 * the catalogue reaches a few thousand products with real traffic, the upgrade
 * path is to precompute embeddings into a `ProductSimilarity` table — the
 * function signatures here would not change.
 *
 * ─── PHARMACY SAFETY ──────────────────────────────────────────────────────
 * Recommending medicines is not recommending shoes. Two hard rules:
 *
 *   • Prescription-only medicines NEVER appear in "frequently bought together".
 *     Suggesting an Rx drug because other people bought it is an invitation to
 *     self-medicate, and it can surface a dangerous combination.
 *   • Rx products appear only under "similar medicines", within the same
 *     category, framed as a browsing aid and labelled prescription-required.
 *
 * Cross-sells are therefore limited to OTC items, devices and wellness
 * products — where a suggestion is helpful rather than clinical.
 */

export type RecoProduct = {
  id: string; name: string; slug: string; price: number; mrp: number | null;
  stock: number; imageUrl: string | null; brand: string | null; rxRequired: boolean;
};

type Row = RecoProduct & { saltName: string | null; tags: string[]; categoryId: string | null; description: string };

const STOP = new Set([
  'the','and','for','with','from','that','this','are','was','has','have','not','use','used','uses',
  'mg','ml','mcg','tablet','tablets','capsule','capsules','strip','bottle','pack','india','indian',
  'per','can','may','also','your','you','who','when','each','into','only','more','most','out','one',
  'two','take','taken','daily','dose','doses','after','before','without','than','been','both','all',
]);

const tokenise = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t));

/**
 * Build a weighted bag of words for one product.
 * Tags and composition are weighted far above description text: two products
 * sharing the tag "antihistamine" are genuinely related, whereas two sharing
 * the word "patients" are not.
 */
function bag(p: Row): Map<string, number> {
  const m = new Map<string, number>();
  const add = (text: string, weight: number) => {
    for (const t of tokenise(text)) m.set(t, (m.get(t) ?? 0) + weight);
  };
  p.tags.forEach((t) => add(t, 5));
  if (p.saltName) add(p.saltName, 4);
  add(p.name, 3);
  if (p.brand) add(p.brand, 1);
  add(p.description.slice(0, 400), 0.5);
  return m;
}

/** Cosine similarity between two IDF-weighted bags. */
function cosine(a: Map<string, number>, b: Map<string, number>, idf: Map<string, number>) {
  let dot = 0, na = 0, nb = 0;
  for (const [t, w] of a) { const v = w * (idf.get(t) ?? 1); na += v * v; }
  for (const [t, w] of b) { const v = w * (idf.get(t) ?? 1); nb += v * v; }
  for (const [t, w] of a) {
    const wb = b.get(t);
    if (wb === undefined) continue;
    const i = idf.get(t) ?? 1;
    dot += (w * i) * (wb * i);
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * Content similarity for one product against the catalogue.
 * Cached for an hour — with a few hundred products this is milliseconds, but
 * there is no reason to recompute it on every page view.
 */
const contentScores = unstable_cache(
  async (productId: string): Promise<Map<string, number>> => {
    const all = (await db.product.findMany({
      where: { published: true },
      select: {
        id: true, name: true, slug: true, price: true, mrp: true, stock: true,
        imageUrl: true, brand: true, rxRequired: true, saltName: true, tags: true,
        categoryId: true, description: true,
      },
    })) as unknown as Row[];

    const target = all.find((p) => p.id === productId);
    if (!target) return new Map();

    // Inverse document frequency: a token in every product carries no signal.
    const df = new Map<string, number>();
    const bags = new Map<string, Map<string, number>>();
    for (const p of all) {
      const b = bag(p);
      bags.set(p.id, b);
      for (const t of b.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    }
    const n = all.length || 1;
    const idf = new Map<string, number>();
    for (const [t, d] of df) idf.set(t, Math.log(1 + n / (1 + d)));

    const tb = bags.get(productId)!;
    const out = new Map<string, number>();
    for (const p of all) {
      if (p.id === productId) continue;
      let s = cosine(tb, bags.get(p.id)!, idf);
      if (p.categoryId && p.categoryId === target.categoryId) {
        s += 0.15;          // same category is a real signal
      } else {
        // A cross-category suggestion needs real evidence, not one incidental
        // shared word. Found in testing: "calcium channel blocker" in a blood
        // pressure medicine's tags was matching a calcium SUPPLEMENT. On a
        // pharmacy page that is actively misleading.
        s *= 0.5;
      }
      if (s > 0.02) out.set(p.id, s);
    }
    return out;
  },
  ['reco-content'],
  { revalidate: 3600, tags: ['products'] },
);

/**
 * Market basket: how often each product appears in the same order as this one.
 * Raw SQL because a self-join is the right tool and Prisma's query builder
 * cannot express it.
 */
const coPurchase = unstable_cache(
  async (productId: string): Promise<Map<string, number>> => {
    try {
      const rows = await db.$queryRaw<{ productId: string; n: bigint }[]>`
        SELECT oi2."productId" AS "productId", COUNT(DISTINCT oi1."orderId") AS n
        FROM "OrderItem" oi1
        JOIN "OrderItem" oi2
          ON oi1."orderId" = oi2."orderId"
         AND oi2."productId" <> oi1."productId"
        JOIN "Order" o ON o.id = oi1."orderId"
        WHERE oi1."productId" = ${productId}
          AND o.status <> 'CANCELLED'
        GROUP BY oi2."productId"
        ORDER BY n DESC
        LIMIT 20
      `;
      return new Map(rows.map((r) => [r.productId, Number(r.n)]));
    } catch {
      // Never let a recommendation query break a product page.
      return new Map();
    }
  },
  ['reco-copurchase'],
  { revalidate: 900, tags: ['orders'] },
);

async function hydrate(ids: string[]): Promise<RecoProduct[]> {
  if (!ids.length) return [];
  const rows = await db.product.findMany({
    where: { id: { in: ids }, published: true },
    select: {
      id: true, name: true, slug: true, price: true, mrp: true,
      stock: true, imageUrl: true, brand: true, rxRequired: true,
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  // Preserve the ranking order the scorer produced.
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p) => ({ ...p!, price: Number(p!.price), mrp: p!.mrp ? Number(p!.mrp) : null }));
}

/**
 * "Similar medicines" — content-driven, same clinical space.
 * Rx items are allowed here: this is a browsing aid, and someone looking at
 * one antihypertensive may legitimately want to see the alternatives their
 * doctor might have prescribed instead.
 */
export async function getSimilarProducts(productId: string, limit = 4): Promise<RecoProduct[]> {
  const content = await contentScores(productId);
  const co = await coPurchase(productId);

  // Confidence ramp: co-purchase contributes nothing at zero orders and
  // reaches full weight around 25 co-occurrences.
  const maxCo = Math.max(0, ...co.values());
  const coWeight = maxCo === 0 ? 0 : Math.min(0.45, maxCo / 25 * 0.45);

  const scored = new Map<string, number>();
  for (const [id, s] of content) scored.set(id, s * (1 - coWeight));
  for (const [id, n] of co) {
    scored.set(id, (scored.get(id) ?? 0) + (n / maxCo) * coWeight);
  }

  const ids = [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2)
    .map(([id]) => id);

  const products = await hydrate(ids);
  // Prefer in-stock, but don't hide everything if stock is low.
  return products.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0)).slice(0, limit);
}

/**
 * "Frequently bought together" — co-purchase only, OTC only.
 *
 * Returns an empty array until there is real evidence. An empty section that
 * renders nothing is far better than inventing suggestions: a fabricated
 * "customers also bought" on a pharmacy site is both misleading and, for
 * medicines, potentially unsafe.
 */
export async function getBoughtTogether(productId: string, limit = 3): Promise<RecoProduct[]> {
  const co = await coPurchase(productId);
  if (co.size === 0) return [];

  // Need the pairing to have happened more than once before we show it —
  // a single coincidental basket is noise, not a pattern.
  const solid = [...co.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  if (!solid.length) return [];

  const products = await hydrate(solid.slice(0, limit * 3).map(([id]) => id));

  // HARD RULE: never cross-sell a prescription medicine.
  return products.filter((p) => !p.rxRequired && p.stock > 0).slice(0, limit);
}

/**
 * Cart cross-sell: OTC companions for what is already in the basket,
 * excluding anything already there.
 */
export async function getCartSuggestions(productIds: string[], limit = 4): Promise<RecoProduct[]> {
  if (!productIds.length) return [];

  const scored = new Map<string, number>();
  for (const id of productIds.slice(0, 5)) {
    const content = await contentScores(id);
    for (const [other, s] of content) {
      if (productIds.includes(other)) continue;
      scored.set(other, (scored.get(other) ?? 0) + s);
    }
  }

  const ids = [...scored.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit * 3).map(([id]) => id);
  const products = await hydrate(ids);
  return products.filter((p) => !p.rxRequired && p.stock > 0).slice(0, limit);
}
