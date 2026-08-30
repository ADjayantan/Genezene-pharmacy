import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSimilarProducts } from '@/lib/recommendations';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

type Hit = {
  id: string; name: string; slug: string; price: number;
  brand: string | null; stock: number; rxRequired: boolean;
};

export async function GET(req: Request) {
  // Autocomplete fires on every keystroke, so the ceiling is generous — but an
  // unbounded public endpoint running ILIKE scans is a cheap way to load the DB.
  const rl = rateLimit(`search:${clientIp(req)}`, 120, 60_000);
  if (!rl.ok) return NextResponse.json({ matches: [], related: [] }, { status: 429 });

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ matches: [], related: [] });

  const select = {
    id: true, name: true, slug: true, price: true,
    brand: true, stock: true, rxRequired: true,
  };

  const matches = await db.product.findMany({
    where: {
      published: true,
      // Search the generic name too. In a pharmacy people ask for
      // "paracetamol" as often as they ask for "Dolo".
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { saltName: { contains: q, mode: 'insensitive' } },
      ],
    },
    select,
    take: 6,
    orderBy: [{ stock: 'desc' }, { name: 'asc' }],
  });

  /* Related products, driven by the same similarity engine as the product
     page. Two reasons this matters in a pharmacy:
       - someone searching a brand often wants to see the alternatives their
         doctor might accept, and
       - a search that returns one result, or nothing, is otherwise a dead end.
     Anchored on the best match; when nothing matched at all we have no anchor,
     so we return none rather than guessing. */
  let related: Hit[] = [];
  if (matches.length > 0) {
    const seen = new Set(matches.map((m) => m.id));
    const sims = await getSimilarProducts(matches[0].id, 6).catch(() => []);
    related = sims
      .filter((s) => !seen.has(s.id) && s.stock > 0)
      .slice(0, 3)
      .map((s) => ({
        id: s.id, name: s.name, slug: s.slug, price: s.price,
        brand: s.brand, stock: s.stock, rxRequired: s.rxRequired,
      }));
  }

  return NextResponse.json(
    {
      matches: matches.map((p) => ({ ...p, price: Number(p.price) })),
      related,
    },
    { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } },
  );
}
