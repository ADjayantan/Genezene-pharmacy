'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Hit = {
  id: string; name: string; slug: string; price: number;
  brand: string | null; stock: number; rxRequired: boolean;
};
type Results = { matches: Hit[]; related: Hit[] };

const EMPTY: Results = { matches: [], related: [] };

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  // Flat list so arrow keys move through matches and related as one sequence.
  const flat = [...res.matches, ...res.related];

  // Debounced, and aborted on change — without the abort, slow responses
  // arrive out of order and the list flickers between queries.
  useEffect(() => {
    if (q.trim().length < 2) { setRes(EMPTY); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (r.ok) { setRes(await r.json()); setOpen(true); }
      } catch { /* aborted or offline */ }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const go = (slug?: string) => {
    setOpen(false);
    router.push(slug ? `/products/${slug}` : `/products?q=${encodeURIComponent(q.trim())}`);
  };

  const row = (h: Hit, i: number) => (
    <li key={h.id} role="option" aria-selected={i === active}>
      <button
        onMouseEnter={() => setActive(i)}
        onClick={() => go(h.slug)}
        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
          i === active ? 'bg-green-wash' : ''
        }`}
      >
        <span className="min-w-0">
          <span className="font-display block truncate text-[0.9rem] font-medium">
            {h.name}
            {h.rxRequired && (
              <span className="mono ml-2 text-[0.62rem] uppercase tracking-[0.06em] text-plum">℞</span>
            )}
          </span>
          {h.brand && <span className="block truncate text-[0.72rem] text-ink-soft">{h.brand}</span>}
        </span>
        <span className="shrink-0 text-right">
          <span className="mono block text-[0.85rem] font-medium">₹{h.price.toFixed(2)}</span>
          {h.stock <= 0 && (
            <span className="mono block text-[0.62rem] uppercase tracking-[0.06em] text-out">
              Out of stock
            </span>
          )}
        </span>
      </button>
    </li>
  );

  return (
    <div ref={box} className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(-1); }}
        onFocus={() => flat.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
          else if (e.key === 'Enter') { e.preventDefault(); go(active >= 0 ? flat[active]?.slug : undefined); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search medicines, vitamins, salt name…"
        aria-label="Search products"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        className="w-full rounded-[3px] border border-paper-edge bg-paper-deep px-[0.8rem] py-2 text-[0.85rem] text-ink outline-none transition-colors focus:border-green placeholder:text-ink-soft/70"
      />

      {open && flat.length > 0 && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-[26rem] overflow-y-auto rounded-[4px] border border-paper-edge bg-paper py-1 shadow-xl shadow-ink/10"
        >
          {res.matches.map((h, i) => row(h, i))}

          {res.related.length > 0 && (
            <>
              <li
                aria-hidden="true"
                className="mt-2 border-y border-paper-edge bg-paper-deep px-4 py-2 text-[0.75rem] font-semibold tracking-wider text-ink-soft flex items-center gap-2 uppercase"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Related Suggestions
              </li>
              {res.related.map((h, i) => row(h, res.matches.length + i))}
            </>
          )}

          <li className="border-t border-paper-edge">
            <button onClick={() => go()} className="w-full px-4 py-2.5 text-left text-[0.82rem] font-semibold text-green">
              See all results for “{q.trim()}” →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
