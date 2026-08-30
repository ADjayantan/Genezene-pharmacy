'use client';

import { useState } from 'react';
import { useCart, type CartLine } from './CartProvider';
import { useToast } from './Toast';
import { Button } from './ui';

export function AddToCart({
  product, full = false,
}: { product: Omit<CartLine, 'qty'>; full?: boolean }) {
  const { add } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);

  if (product.stock <= 0) {
    return <Button tone="quiet" full disabled>Out of stock</Button>;
  }

  const add1 = () => {
    add(product, qty);
    toast(`${product.name} added to cart`);
  };

  if (!full) return <Button tone="primary" full onClick={add1}>Add to cart</Button>;

  return (
    <div className="flex gap-3">
      <div className="flex items-center rounded-[3px] border border-paper-edge">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3.5 py-[0.6rem] text-lg leading-none"
        >
          −
        </button>
        <span className="mono w-8 text-center text-[0.87rem]">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          disabled={qty >= product.stock}
          className="px-3.5 py-[0.6rem] text-lg leading-none disabled:opacity-40"
        >
          +
        </button>
      </div>
      <Button tone="primary" className="flex-1" onClick={add1}>Add to cart</Button>
    </div>
  );
}
