'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string | null;
  rxRequired: boolean;
  stock: number;
};

type CartApi = {
  lines: CartLine[];
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  needsRx: boolean;
  ready: boolean;
};

const Ctx = createContext<CartApi | null>(null);
const KEY = 'genezenz_cart_v1';

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart must be used inside <CartProvider>');
  return c;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  // `ready` guards against a hydration mismatch: the server renders an empty
  // cart, so we must not paint the stored cart until after mount.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* private mode / corrupt data — start empty rather than crash */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* quota or blocked storage — cart still works for this session */
    }
  }, [lines, ready]);

  const api = useMemo<CartApi>(() => {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    return {
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      needsRx: lines.some((l) => l.rxRequired),
      add: (line, qty = 1) =>
        setLines((v) => {
          const found = v.find((l) => l.id === line.id);
          if (found) {
            // Never let the cart exceed available stock.
            return v.map((l) =>
              l.id === line.id ? { ...l, qty: Math.min(l.qty + qty, line.stock) } : l,
            );
          }
          return [...v, { ...line, qty: Math.min(qty, line.stock) }];
        }),
      setQty: (id, qty) =>
        setLines((v) =>
          qty <= 0
            ? v.filter((l) => l.id !== id)
            : v.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, l.stock) } : l)),
        ),
      remove: (id) => setLines((v) => v.filter((l) => l.id !== id)),
      clear: () => setLines([]),
    };
  }, [lines, ready]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
