'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

export function CartBadge() {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative grid h-11 w-11 place-items-center text-ink-soft transition-colors hover:text-green"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
        <path d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5M7 13l-2 5h14" />
        <circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" />
      </svg>
      {/* Only after hydration — the server renders an empty cart, so painting
          a count before localStorage is read would flash the wrong number. */}
      {ready && count > 0 && (
        <span className="mono absolute right-0.5 top-1 min-w-[1.1rem] rounded-[2px] bg-green px-1 text-center text-[0.62rem] font-medium text-green-on">
          {count}
        </span>
      )}
    </Link>
  );
}
