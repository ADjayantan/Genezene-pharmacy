'use client';

import { useCart, type CartLine } from './CartProvider';
import { useToast } from './Toast';
import { Button } from './ui';

/**
 * Re-adds a past order's still-available items to the cart.
 *
 * Chronic-medicine customers (BP, diabetes, thyroid) reorder the same basket
 * every month — this turns that from "search and re-add each item" into one tap,
 * which is exactly the repeat behaviour a pharmacy lives on.
 *
 * The server has already resolved each line against the CURRENT product (price,
 * stock, Rx status), and dropped anything unpublished or out of stock — so this
 * only ever adds what can actually be bought today.
 */
export function BuyAgain({ lines }: { lines: Omit<CartLine, 'qty'>[]; }) {
  const { add } = useCart();
  const toast = useToast();

  if (lines.length === 0) return null;

  return (
    <Button
      tone="outline"
      size="sm"
      onClick={() => {
        lines.forEach((l) => add(l, 1));
        toast(`${lines.length} item${lines.length === 1 ? '' : 's'} added to your cart`);
      }}
    >
      Buy again
    </Button>
  );
}
