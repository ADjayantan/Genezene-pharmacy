'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { useToast } from './Toast';
import { site } from '@/lib/config';
import { DeliveryProgress } from './DeliveryProgress';
import { Button, ButtonLink, EmptyState, Field, Note, RuleLabel, inputClass } from './ui';

export function CheckoutForm({
  defaults,
}: { defaults: { name: string; phone: string; address: string } }) {
  const { lines, subtotal, needsRx, clear, ready } = useCart();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!ready) return <div className="mt-8 h-64 animate-pulse rounded-[4px] bg-paper-deep" />;

  if (lines.length === 0) {
    return (
      <EmptyState title="Your cart is empty" action={<ButtonLink href="/products">Browse the counter</ButtonLink>} />
    );
  }

  const delivery = subtotal >= site.offers.freeDeliveryAbove ? 0 : 49;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (needsRx && !file) {
      setErr('A prescription is required to complete this order. Please upload one below.');
      return;
    }
    
    setBusy(true);
    setErr('');

    let prescriptionId: string | undefined;

    if (needsRx && file) {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('patientName', (e.currentTarget.elements.namedItem('name') as HTMLInputElement)?.value ?? '');
      
      const rxRes = await fetch('/api/prescriptions/upload', { method: 'POST', body: fd });
      const rxData = await rxRes.json().catch(() => ({}));
      
      if (!rxRes.ok) {
        setErr(rxData.message ?? 'Failed to upload prescription. Please check the file and try again.');
        setBusy(false);
        return;
      }
      prescriptionId = rxData.id;
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...Object.fromEntries(new FormData(e.currentTarget)),
        items: lines.map((l) => ({ id: l.id, qty: l.qty })),
        prescriptionId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      clear();
      toast('Order placed');
      router.push(`/order/${data.orderNo}`);
    } else {
      setErr(data.message ?? 'Could not place the order');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_21rem] lg:items-start">
      <div>
        {/* Zeigarnik effect: an unfinished sequence nags at people, but only
            when they can see where they are in it. Three visible steps also
            answer the question that drives most checkout abandonment —
            "how much more of this is there?" */}
        <ol className="mono mb-8 flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.1em]">
          {['Cart', 'Details', 'Done'].map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className={i <= 1 ? 'text-green' : 'text-ink-soft'}>
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-[1px] ${i <= 1 ? 'bg-green' : 'bg-paper-edge'}`} />
                {s}
              </span>
              {i < 2 && <span className="h-px w-6 bg-paper-edge" />}
            </li>
          ))}
        </ol>

        <RuleLabel>Delivery details</RuleLabel>
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input name="name" required defaultValue={defaults.name} className={inputClass} autoComplete="name" />
            </Field>
            <Field label="Phone">
              <input name="phone" type="tel" required defaultValue={defaults.phone} className={inputClass} autoComplete="tel" />
            </Field>
          </div>

          <Field label="Delivery address">
            <textarea
              name="address" required rows={3} minLength={10} defaultValue={defaults.address}
              className={inputClass} autoComplete="street-address"
              placeholder="House / flat no., street, area, landmark"
            />
          </Field>

          <div className="max-w-[200px]">
            <Field label="PIN code">
              <input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" className={inputClass} autoComplete="postal-code" placeholder="641006" />
            </Field>
          </div>

          <Field label="Notes for the pharmacist" hint="Optional">
            <textarea name="notes" rows={2} maxLength={500} className={inputClass} placeholder="Delivery timing, substitutions you allow, and so on" />
          </Field>
        </div>

        <RuleLabel className="mt-10">Payment</RuleLabel>
        <div className="mt-4 rounded-[3px] border border-paper-edge bg-paper-deep px-5 py-4">
          <p className="text-[0.92rem] font-medium">Cash on delivery</p>
          <p className="mt-1 text-[0.78rem] text-ink-soft">
            Pay the delivery agent when your order arrives. Online payment can be added later.
          </p>
        </div>

        {needsRx && (
          <>
            <RuleLabel className="mt-10">Prescription Upload</RuleLabel>
            <div className="mt-4 rounded-[3px] border-2 border-dashed border-plum/30 bg-plum/5 px-5 py-4">
              <p className="text-[0.92rem] font-medium text-plum">Prescription Required</p>
              <p className="mt-1 text-[0.78rem] text-ink-soft">
                Your order includes prescription medicines. You must attach a valid prescription before placing this order.
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-center rounded-[3px] border border-plum bg-paper px-4 py-2.5 text-[0.87rem] font-semibold text-plum transition-colors hover:bg-plum hover:text-white">
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 8 * 1024 * 1024) {
                      setErr('File is too large (max 8MB).');
                      setFile(null);
                    } else {
                      setFile(f || null);
                      setErr('');
                    }
                  }}
                />
                <span className="truncate max-w-[250px]">{file ? file.name : 'Choose file or take photo'}</span>
              </label>
              {file && (
                <p className="mt-2 text-center text-[0.75rem] font-medium text-green">
                  ✓ File attached. Ready to place order.
                </p>
              )}
            </div>
          </>
        )}

        {err && <p role="alert" className="mt-4 text-[0.87rem] text-out">{err}</p>}

        {/* Anxiety peaks at the last step. A pharmacy's answer to that is a
            person on the phone, not a chat bubble. */}
        <p className="mt-6 text-[0.82rem] text-ink-soft mb-24 sm:mb-0">
          Not sure about something? Call the counter on{' '}
          <a href={`tel:${site.phone}`} className="mono font-semibold text-green">{site.phoneDisplay}</a>{' '}
          and a pharmacist will take the order over the phone instead.
        </p>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="rounded-[4px] border border-paper-edge border-t-2 border-t-green bg-paper-deep p-6">
          <RuleLabel className="border-t-0 pt-0">Your order</RuleLabel>
          <ul className="mono mt-4 space-y-2 text-[0.82rem]">
            {lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-ink-soft">{l.name} × {l.qty}</span>
                <span className="shrink-0">₹{(l.price * l.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <dl className="mono mt-4 space-y-2 border-t border-paper-edge pt-4 text-[0.87rem]">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>₹{subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery</dt>
              <dd>{delivery === 0 ? <span className="text-in">Free</span> : `₹${delivery}.00`}</dd>
            </div>
            <div className="flex justify-between border-t border-paper-edge pt-2 text-base font-medium">
              <dt>Total</dt><dd>₹{(subtotal + delivery).toFixed(2)}</dd>
            </div>
          </dl>

          <DeliveryProgress subtotal={subtotal} />

          <div className="fixed inset-x-0 bottom-0 z-50 p-4 bg-paper border-t border-paper-edge shadow-[0_-10px_30px_rgba(0,0,0,0.08)] sm:static sm:p-0 sm:bg-transparent sm:border-none sm:shadow-none sm:mt-5">
            <Button tone="primary" full type="submit" disabled={busy} className="py-3 sm:py-2 text-[0.95rem] sm:text-[0.87rem]">
              {busy ? 'Placing order…' : 'Place order'}
            </Button>
          </div>
        </div>
      </aside>
    </form>
  );
}
