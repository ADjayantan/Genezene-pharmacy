'use client';

import { useEffect, useState } from 'react';
import { AddToCart } from './AddToCart';
import type { CartLine } from './CartProvider';

/**
 * On a phone, the add-to-cart button scrolls out of reach as soon as someone
 * starts reading the product details — exactly when they are deciding. This
 * pins it to the bottom of the viewport, which is also the easiest place for a
 * thumb to reach on a large screen.
 *
 * It appears only after the inline button has scrolled away, so there are
 * never two identical buttons competing on screen.
 */
export function StickyBuyBar({
  product, price,
}: { product: Omit<CartLine, 'qty'>; price: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById('buy-anchor');
    if (!anchor) return;
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' },
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);

  if (product.stock <= 0) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-paper-edge bg-paper/97 px-4 py-3 backdrop-blur transition-transform md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8rem] font-medium">{product.name}</p>
          <p className="mono text-[0.95rem] font-medium">₹{price.toFixed(2)}</p>
        </div>
        <div className="w-[9.5rem] shrink-0">
          <AddToCart product={product} />
        </div>
      </div>
    </div>
  );
}
