import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
// Drug labels change rarely. Cache for a day and serve stale for a week —
// openFDA is rate-limited and occasionally slow.
export const revalidate = 86400;

/**
 * openFDA drug-label lookup, proxied server-side.
 *
 * Proxying rather than calling from the browser means the response is cached
 * once for everyone instead of per visitor, and if an API key is added later
 * it stays on the server.
 */
export async function GET(req: Request) {
  const rl = rateLimit(`fda:${clientIp(req)}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: 'Too many lookups' }, { status: 429 });

  const q = new URL(req.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const key = process.env.OPENFDA_API_KEY;
  const url =
    `https://api.fda.gov/drug/label.json?search=` +
    encodeURIComponent(`openfda.generic_name:"${q}" OR openfda.brand_name:"${q}"`) +
    `&limit=3${key ? `&api_key=${key}` : ''}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    const results = (data.results ?? []).map((r: any) => ({
      brandName: r.openfda?.brand_name?.[0] ?? null,
      genericName: r.openfda?.generic_name?.[0] ?? null,
      manufacturer: r.openfda?.manufacturer_name?.[0] ?? null,
      purpose: r.purpose?.[0]?.slice(0, 600) ?? null,
      warnings: r.warnings?.[0]?.slice(0, 800) ?? null,
    }));

    return NextResponse.json({
      results,
      // Surfaced in the UI: this is US labelling and is reference material only.
      disclaimer:
        'Source: openFDA (US FDA labelling). Reference information only — it may differ from the Indian pack insert. Always follow your doctor’s instructions.',
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
