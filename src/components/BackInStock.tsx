'use client';

import { useState } from 'react';
import { Button, inputClass } from './ui';

/**
 * "Tell me when it's back." An out-of-stock product is otherwise a dead end —
 * the customer leaves and may not return. One phone field captures that demand
 * and drops it straight into the lead inbox as a restock request, so the shop
 * both recovers the sale and learns what to reorder.
 *
 * Posts to the same /api/leads endpoint as every other lead, tagged in the
 * message so the pharmacist knows why it came in.
 */
export function BackInStock({ productName }: { productName: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState('sending');
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: (fd.get('name') as string) || 'Restock request',
        phone: fd.get('phone'),
        message: `Notify when back in stock: ${productName}`,
        website: '', // honeypot
      }),
    }).catch(() => null);
    setState(res?.ok ? 'done' : 'error');
  }

  if (state === 'done') {
    return (
      <div role="status" className="mt-4 rounded-[3px] border-l-[3px] border-green bg-green-wash px-4 py-3 text-[0.87rem]">
        We&apos;ll call you the moment it&apos;s back in stock.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-[3px] border border-paper-edge bg-paper-deep p-4">
      <p className="text-[0.87rem] font-medium">Out of stock — want it when it&apos;s back?</p>
      <p className="mt-0.5 text-[0.78rem] text-ink-soft">
        Leave your number and we&apos;ll call you the moment it arrives.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input name="name" placeholder="Name" className={`${inputClass} max-w-[9rem] flex-1`} aria-label="Your name" />
        <input name="phone" type="tel" required placeholder="Phone" className={`${inputClass} max-w-[10rem] flex-1`} aria-label="Your phone number" />
        <Button tone="primary" size="sm" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Notify me'}
        </Button>
      </div>
      {state === 'error' && <p role="alert" className="mt-2 text-[0.8rem] text-out">Something went wrong. Please call us instead.</p>}
    </form>
  );
}
