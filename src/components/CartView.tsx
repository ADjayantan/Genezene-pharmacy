'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { site } from '@/lib/config';
import { ButtonLink, EmptyState, MortarGlyph, Note, Price, RuleLabel, Tag } from './ui';
import { DeliveryProgress } from './DeliveryProgress';

export function CartView() {
  const { lines, setQty, remove, subtotal, needsRx, ready } = useCart();

  // Skeleton, not an empty-cart message. Flashing "your cart is empty" and
  // then filling in is a real perceived-quality bug.
  if (!ready) return <div className="mt-8 h-48 animate-pulse rounded-[4px] bg-paper-deep" />;

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        action={<ButtonLink href="/products">Browse the counter</ButtonLink>}
      >
        Add medicines and they will show up here.
      </EmptyState>
    );
  }

  const delivery = subtotal >= site.offers.freeDeliveryAbove ? 0 : 49;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_21rem] lg:items-start">
      <div className="space-y-3">
        {lines.map((l) => (
          <div key={l.id} className="flex gap-4 rounded-[4px] border border-paper-edge p-4">
            <Link href={`/products/${l.slug}`} className="shrink-0">
              <div className="grid h-18 w-18 place-items-center bg-paper-deep">
                {l.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.imageUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <MortarGlyph size={30} className="text-paper-edge" />
                )}
              </div>
            </Link>

            <div className="min-w-0 flex-1">
              <Link href={`/products/${l.slug}`} className="font-display text-[0.95rem] font-medium hover:text-green">
                {l.name}
              </Link>
              {l.rxRequired && <span className="ml-2"><Tag tone="rx">℞</Tag></span>}
              <p className="mono mt-1 text-[0.78rem] text-ink-soft">₹{l.price.toFixed(2)} each</p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center rounded-[3px] border border-paper-edge">
                  <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Decrease" className="px-3 py-1.5 leading-none">−</button>
                  <span className="mono w-8 text-center text-[0.85rem]">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.id, l.qty + 1)}
                    aria-label="Increase"
                    disabled={l.qty >= l.stock}
                    className="px-3 py-1.5 leading-none disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button onClick={() => remove(l.id)} className="text-[0.82rem] text-ink-soft transition-colors hover:text-out">
                  Remove
                </button>
              </div>
              {l.qty >= l.stock && (
                <p className="mono mt-1.5 text-[0.66rem] uppercase tracking-[0.06em] text-low">
                  Only {l.stock} available
                </p>
              )}
            </div>

            <p className="shrink-0"><Price value={l.price * l.qty} size="sm" /></p>
          </div>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="rounded-[4px] border border-paper-edge border-t-2 border-t-green bg-paper-deep p-6">
          <RuleLabel className="border-t-0 pt-0">Summary</RuleLabel>
          <dl className="mono mt-4 space-y-2 text-[0.87rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Subtotal</dt><dd>₹{subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Delivery</dt>
              <dd>{delivery === 0 ? <span className="text-in">Free</span> : `₹${delivery}.00`}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-paper-edge pt-2 text-base font-medium">
              <dt>Total</dt><dd>₹{(subtotal + delivery).toFixed(2)}</dd>
            </div>
          </dl>

          <DeliveryProgress subtotal={subtotal} />

          {needsRx && (
            <Note tone="rx">
              Your cart contains prescription medicines. You will be asked to upload a valid
              prescription — a pharmacist verifies it before dispatch.
            </Note>
          )}

          <ButtonLink href="/checkout" full className="mt-5">Proceed to checkout</ButtonLink>
        </div>
      </aside>
    </div>
  );
}
