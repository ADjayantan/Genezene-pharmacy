import { NextResponse } from 'next/server';
import { getCartSuggestions } from '@/lib/recommendations';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Cart cross-sell. The cart lives in localStorage, so the browser has to tell
 * us what's in it — the server has no session-side cart to read.
 */
export async function GET(req: Request) {
  const rl = rateLimit(`reco:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json([], { status: 429 });

  const raw = new URL(req.url).searchParams.get('ids') ?? '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (!ids.length) return NextResponse.json([]);

  const items = await getCartSuggestions(ids, 4).catch(() => []);
  return NextResponse.json(items, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
