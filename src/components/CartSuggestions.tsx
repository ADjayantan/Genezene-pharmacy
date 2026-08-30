'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { AddToCart } from './AddToCart';
import { MortarGlyph, Price, RuleLabel } from './ui';
import type { RecoProduct } from '@/lib/recommendations';

/**
 * OTC companions for what is already in the basket.
 * Client-side because the cart lives in localStorage — the server has nothing
 * to read. Renders nothing while loading and nothing when there is no good
 * suggestion, so it never leaves an orphaned heading on the page.
 */
export function CartSuggestions() {
  const { lines, ready } = useCart();
  const [items, setItems] = useState<RecoProduct[]>([]);
  const key = lines.map((l) => l.id).sort().join(',');

  useEffect(() => {
    if (!ready || !key) { setItems([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/recommendations?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => { /* aborted or offline — show nothing */ });
    return () => ctrl.abort();
  }, [key, ready]);

  if (items.length === 0) return null;

  return (
    <section className="mt-18">
      <RuleLabel>You might also need</RuleLabel>
      <h2 className="mt-2 text-[1.4rem]">Over-the-counter items that go with your order</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <article key={p.id} className="rounded-[4px] border border-paper-edge border-t-2 border-t-green p-4">
            <Link href={`/products/${p.slug}`}>
              <div className="mb-3 grid h-24 place-items-center bg-paper-deep">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-2" />
                ) : (
                  <MortarGlyph size={34} className="text-paper-edge" />
                )}
              </div>
              <h3 className="font-display line-clamp-2 text-[0.92rem] font-medium leading-snug">{p.name}</h3>
              <p className="mt-1"><Price value={p.price} size="sm" /></p>
            </Link>
            <div className="mt-3"><AddToCart product={p} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
